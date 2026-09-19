import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotesAPI } from "@/hooks/useNotesApi";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Loader, Mic, Languages, Sparkles, Info } from "lucide-react";
import { DeleteBtn } from "@/components/common/DelateBtn";
import { toast } from "sonner";
import AutoSave from "@/components/note/AutoSave";
import { useNoteSave } from "@/hooks/useNoteSave";
import { Rewrite } from "@/components/select/rewrite";
import { useAuth } from "@clerk/react";
import {
  summarizeText,
  rewriteText,
  translateText,
  type RewriteMode,
} from "@/hooks/useAi";
import { useIntl } from "react-intl";
import { useLang } from "@/hooks/useLang";

import type { Note } from "@/types";

function NoteDetailPage() {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { isRtl, lang, path } = useLang();

  const handleClick = () => {
    navigate(path("/"));
  };

  const { getNote, deleteNote, saveNote } = useNotesAPI();
  const { getToken } = useAuth();
  const { id } = useParams();

  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [rewriteMode, setRewriteMode] = useState<RewriteMode>();
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Mic tooltip text
  const micTooltipText =
    lang === "ar"
      ? "المايك بينقل صوتك للغة العربية، لو الموقع شغال إنجليزي هيتكتب الكلام إنجليزي"
      : "The mic transcribes based on the site's current language";

  const handleSave = useCallback(async () => {
    if (!note) return;

    setSaveStatus("saving");

    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));

    const [updatedNote] = await Promise.all([
      saveNote(note.id, {
        title: note.title,
        content: note.content,
      }),
      minDelay,
    ]);

    if (updatedNote) {
      setNote(updatedNote);
      setIsEditing(false);
      setSaveStatus("saved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, saveNote]);

  const { saveStatus, setSaveStatus } = useNoteSave({
    note,
    isEditing,
    handleSave,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  /*
   * النص النهائي الذي تم قبوله وإضافته بالفعل إلى الـTextarea.
   *
   * مهم جدًا:
   * لا نعتمد فقط على طول النص، لأن بعض متصفحات الموبايل
   * تعيد إرسال نفس الـfinal transcript أكثر من مرة.
   */
  const lastFinalTextRef = useRef<string>("");

  /*
   * آخر نص كامل رجعه SpeechRecognition.
   * نستخدمه لمقارنة النتائج الجديدة بالقديمة.
   */
  const previousTranscriptRef = useRef<string>("");

  /*
   * آخر نص تمت إضافته بالفعل.
   * يستخدم لمنع تكرار نفس الجملة.
   */
  const lastAddedTextRef = useRef<string>("");

  /*
   * لمنع تشغيل recognition.start() أكثر من مرة
   * خصوصًا في بعض متصفحات الموبايل.
   */
  const startingRecognitionRef = useRef(false);

  /*
   * تنظيف النص قبل المقارنة.
   */
  const normalizeSpeechText = useCallback((text: string) => {
    return text
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  /*
   * معرفة هل النص الجديد يبدأ بالنص القديم.
   */
  const getNewTextFromTranscript = useCallback(
    (oldText: string, newText: string) => {
      const oldNormalized = normalizeSpeechText(oldText);
      const newNormalized = normalizeSpeechText(newText);

      if (!newNormalized) {
        return "";
      }

      if (!oldNormalized) {
        return newNormalized;
      }


      if (oldNormalized === newNormalized) {
        return "";
      }

      /*
       * البحث عن أطول جزء مشترك في نهاية القديم
       * وبداية الجديد.
       *
       * هذا مفيد عندما يقوم محرك الموبايل بإعادة
       * بناء الـtranscript بطريقة مختلفة قليلًا.
       */
      const maxLength = Math.min(
        oldNormalized.length,
        newNormalized.length
      );

      for (let i = maxLength; i > 0; i--) {
        const oldSuffix = oldNormalized.slice(-i);
        const newPrefix = newNormalized.slice(0, i);

        if (oldSuffix === newPrefix) {
          return newNormalized.slice(i).trim();
        }
      }

      /*
       * لو لم نستطع معرفة الجزء الجديد بأمان،
       * نرجع النص الجديد كاملًا فقط إذا كان مختلفًا
       * عن النص الذي أضفناه آخر مرة.
       */
      return newNormalized;
    },
    [normalizeSpeechText]
  );

  const handleRecordStart = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition: new () => SpeechRecognition;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert(formatMessage({ id: "note.speechUnsupported" }));
      return;
    }

    /*
     * Reset كل بيانات التسجيل السابقة.
     */
    lastFinalTextRef.current = "";
    previousTranscriptRef.current = "";
    lastAddedTextRef.current = "";
    setInterimText("");

    const recognition = new SpeechRecognitionAPI();

    recognition.lang = lang === "ar" ? "ar-EG" : "en-US";

    /*
     * continuous = true
     * حتى يستمر التسجيل أثناء الكلام.
     */
    recognition.continuous = true;

    /*
     * نحتاج interim حتى يظهر الكلام المؤقت.
     */
    recognition.interimResults = true;

    /*
     * نريد نتيجة واحدة فقط.
     */
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullFinalText = "";
      let interim = "";

      /*
       * مهم:
       * نقرأ كل النتائج الموجودة حاليًا،
       * لأن بعض متصفحات الموبايل لا ترسل فقط
       * النتيجة الجديدة.
       */
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];

        if (!result || !result[0]) {
          continue;
        }

        const transcript = result[0].transcript || "";

        if (result.isFinal) {
          fullFinalText += ` ${transcript}`;
        } else {
          interim += ` ${transcript}`;
        }
      }

      fullFinalText = normalizeSpeechText(fullFinalText);
      interim = normalizeSpeechText(interim);

      /*
       * لا يوجد final text جديد.
       */
      if (!fullFinalText) {
        setInterimText(interim);
        return;
      }

      const previousTranscript =
        previousTranscriptRef.current;

      /*
       * لو نفس الـtranscript رجع مرة أخرى من الموبايل،
       * لا نفعل أي شيء.
       */
      if (
        previousTranscript &&
        fullFinalText === previousTranscript
      ) {
        setInterimText(interim);
        return;
      }

      /*
       * استخراج الجزء الجديد فقط.
       */
      const newText = getNewTextFromTranscript(
        previousTranscript,
        fullFinalText
      );

      /*
       * حفظ الـtranscript الحالي للمقارنة القادمة.
       */
      previousTranscriptRef.current = fullFinalText;

      if (newText) {
        const cleanNewText =
          normalizeSpeechText(newText);

        /*
         * حماية إضافية:
         *
         * لو الموبايل أرسل نفس الجملة التي أضفناها
         * في الحدث السابق، لا نضيفها مرة أخرى.
         */
        const lastAdded =
          normalizeSpeechText(lastAddedTextRef.current);

        if (
          cleanNewText &&
          cleanNewText !== lastAdded
        ) {
          setNote((prev) => {
            if (!prev) return null;

            const currentContent =
              prev.content?.trim() || "";

            /*
             * حماية إضافية على مستوى المحتوى نفسه.
             *
             * لو آخر جزء من الـTextarea بالفعل
             * هو نفس النص القادم، لا نضيفه.
             */
            if (currentContent) {
              const normalizedCurrent =
                normalizeSpeechText(currentContent);

              const normalizedNew =
                normalizeSpeechText(cleanNewText);

              if (
                normalizedCurrent === normalizedNew ||
                normalizedCurrent.endsWith(
                  normalizedNew
                )
              ) {
                return prev;
              }
            }

            const separator =
              currentContent.length > 0 ? " " : "";

            return {
              ...prev,
              content:
                currentContent +
                separator +
                cleanNewText,
            };
          });

          lastAddedTextRef.current = cleanNewText;
          lastFinalTextRef.current = fullFinalText;

          setIsEditing(true);
          setSaveStatus("unsaved");
        }
      }

      setInterimText(interim);
    };

    recognition.onerror = (
      event: SpeechRecognitionErrorEvent
    ) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      startingRecognitionRef.current = false;

      setIsRecording(false);
      setInterimText("");

      /*
       * بعض الأخطاء طبيعية على الموبايل،
       * لذلك لا نظهر Toast لكل خطأ.
       */
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        toast.error(
          formatMessage({
            id: "note.speechUnsupported",
          })
        );
      }
    };

    recognition.onend = () => {
      startingRecognitionRef.current = false;

      setIsRecording(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;

    /*
     * منع start المتكرر.
     */
    if (startingRecognitionRef.current) {
      return;
    }

    startingRecognitionRef.current = true;

    try {
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error(
        "Speech recognition start error:",
        error
      );

      startingRecognitionRef.current = false;
      setIsRecording(false);
      setInterimText("");
    }
  };

  /*
   * تنظيف Speech Recognition عند مغادرة الصفحة.
   */
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors during unmount.
      }

      recognitionRef.current = null;
      startingRecognitionRef.current = false;
    };
  }, []);

  /*
   * جلب الملاحظة.
   */
  useEffect(() => {
    const fetchNote = async () => {
      if (id) {
        const note = await getNote(id);

        if (note) {
          setNote(note);
        }

        setIsLoading(false);
      }
    };

    fetchNote();
  }, [id, getNote]);

  /*
   * تغيير العنوان.
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!note) return;

    setNote((prev) =>
      prev
        ? {
            ...prev,
            title: e.target.value,
          }
        : null
    );

    setIsEditing(true);
    setSaveStatus("unsaved");
  };

  /*
   * تغيير محتوى الملاحظة يدويًا.
   */
  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!note) return;

    setNote((prev) =>
      prev
        ? {
            ...prev,
            content: e.target.value,
          }
        : null
    );

    setIsEditing(true);
    setSaveStatus("unsaved");
  };

  /*
   * حذف الملاحظة.
   */
  const handleDelete = async () => {
    if (!note) return;

    const sucsess = await deleteNote(note.id);

    if (sucsess) {
      navigate(path("/"));

      toast.success(
        formatMessage({
          id: "toast.deleted",
        })
      );
    }
  };

  /*
   * تلخيص النص.
   */
  const handleSummarize = async () => {
    if (!note?.content) {
      toast.error(
        formatMessage({
          id: "toast.noTextSummarize",
        })
      );
      return;
    }

    setAiLoading("summarize");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          formatMessage({
            id: "toast.loginRequired",
          })
        );
      }

      const summary = await summarizeText(
        token,
        note.content
      );

      setNote((prev) =>
        prev
          ? {
              ...prev,
              content: summary,
            }
          : null
      );

      setIsEditing(true);
      setSaveStatus("unsaved");

      toast.success(
        formatMessage({
          id: "toast.summaryDone",
        })
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : formatMessage({
              id: "toast.summarizeFailed",
            })
      );
    } finally {
      setAiLoading(null);
    }
  };

  /*
   * إعادة صياغة النص.
   */
  const handleRewrite = async (
    mode: RewriteMode
  ) => {
    if (!note?.content) {
      toast.error(
        formatMessage({
          id: "toast.noTextRewrite",
        })
      );
      return;
    }

    setAiLoading("rewrite");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          formatMessage({
            id: "toast.loginRequired",
          })
        );
      }

      const rewritten = await rewriteText(
        token,
        note.content,
        mode
      );

      setNote((prev) =>
        prev
          ? {
              ...prev,
              content: rewritten,
            }
          : null
      );

      setIsEditing(true);
      setSaveStatus("unsaved");

      toast.success(
        formatMessage({
          id: "toast.rewriteDone",
        })
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : formatMessage({
              id: "toast.rewriteFailed",
            })
      );
    } finally {
      setAiLoading(null);
    }
  };

  /*
   * ترجمة النص.
   */
  const handleTranslate = async () => {
    if (!note?.content) {
      toast.error(
        formatMessage({
          id: "toast.noTextTranslate",
        })
      );
      return;
    }

    setAiLoading("translate");

    try {
      const token = await getToken();

      if (!token) {
        throw new Error(
          formatMessage({
            id: "toast.loginRequired",
          })
        );
      }

      const isArabic =
        /[\u0600-\u06FF]/.test(note.content);

      const targetLang = isArabic
        ? "English"
        : "Arabic";

      const translation = await translateText(
        token,
        note.content,
        targetLang
      );

      setNote((prev) =>
        prev
          ? {
              ...prev,
              content: translation,
            }
          : null
      );

      setIsEditing(true);
      setSaveStatus("unsaved");

      toast.success(
        formatMessage({
          id: "toast.translateDone",
        })
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : formatMessage({
              id: "toast.translateFailed",
            })
      );
    } finally {
      setAiLoading(null);
    }
  };

  /*
   * Loading.
   */
  if (isLoading && !note) {
    return (
      <div className="flex justify-center items-center py-20 w-full">
        <Loader className="animate-spin h-10 w-10 text-black dark:text-white" />
      </div>
    );
  }

  const isArabicContent = note?.content
    ? /[\u0600-\u06FF]/.test(note.content)
    : false;

  return (
    <GlassCard className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 items-center">
          <Button
            className="w-fit"
            onClick={handleClick}
            variant="outline"
          >
            <ArrowLeft
              className={
                isRtl ? "rotate-180" : ""
              }
            />

            {formatMessage({
              id: "note.back",
            })}
          </Button>

          <AutoSave saveStatus={saveStatus} />
        </div>

        <div>
          <DeleteBtn
            handleDelete={handleDelete}
            title={formatMessage({
              id: "note.deleteTitle",
            })}
            content={formatMessage({
              id: "note.deleteContent",
            })}
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 btn-group flex-wrap">
          <div className="inline-flex items-center gap-1">
            <Button
              onClick={handleRecordStart}
              variant={
                isRecording
                  ? "destructive"
                  : "default"
              }
            >
              {isRecording ? (
                <span className="animate-pulse">
                  🔴
                </span>
              ) : (
                <Mic />
              )}

              <span>
                {formatMessage({
                  id: isRecording
                    ? "note.recording"
                    : "note.speak",
                })}
              </span>
            </Button>

            <button
              type="button"
              aria-label="info"
              onClick={() =>
                toast.info(micTooltipText)
              }
              className="flex items-center justify-center h-6 w-6 rounded-full
                         text-muted-foreground hover:text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={handleSummarize}
            disabled={aiLoading !== null}
            variant="outline"
          >
            <Sparkles />

            {formatMessage({
              id:
                aiLoading === "summarize"
                  ? "note.summarizing"
                  : "note.summarize",
            })}
          </Button>

          <Rewrite
            value={rewriteMode}
            onValueChange={(mode) => {
              setRewriteMode(mode);
              handleRewrite(mode);
            }}
          />

          <Button
            onClick={handleTranslate}
            disabled={aiLoading !== null}
          >
            <Languages />

            {formatMessage({
              id:
                aiLoading === "translate"
                  ? "note.translating"
                  : "note.translate",
            })}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          value={note?.title || ""}
          placeholder={formatMessage({
            id: "note.titlePlaceholder",
          })}
          onChange={handleChange}
          className="focus-plain w-full bg-transparent text-4xl! p-2 h-15 font-bold"
        />

        {isRecording && interimText && (
          <p className="hidden sm:block text-sm text-muted-foreground italic animate-pulse">
            {interimText}
          </p>
        )}

        <Textarea
          placeholder={formatMessage({
            id: "note.contentPlaceholder",
          })}
          value={note?.content || ""}
          rows={30}
          onChange={handleTextareaChange}
          dir={
            isArabicContent || isRtl
              ? "rtl"
              : "ltr"
          }
          className="focus-plain w-full !border-none bg-transparent dark:bg-transparent min-h-[400px]"
        />
      </div>
    </GlassCard>
  );
}

export default NoteDetailPage;