import { GlassCard } from "@/components/common/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNotesAPI } from "@/hooks/useNotesApi";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Loader,
  Mic,
  Languages,
  Sparkles,
  Info,
} from "lucide-react";
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
  const [rewriteMode, setRewriteMode] =
    useState<RewriteMode>();
  const [aiLoading, setAiLoading] =
    useState<string | null>(null);

  const [isRecording, setIsRecording] =
    useState(false);
  const [interimText, setInterimText] =
    useState("");

  const recognitionRef =
    useRef<SpeechRecognition | null>(null);

  const shouldKeepRecordingRef =
    useRef(false);

  const startingRecognitionRef =
    useRef(false);

  const restartingRecognitionRef =
    useRef(false);

  const finalResultsRef =
    useRef<Record<number, string>>({});

  const finalResultOrderRef =
    useRef<number[]>([]);

  const lastAppendedFinalRef =
    useRef("");

  const restartTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const micTooltipText =
    lang === "ar"
      ? "المايك بينقل صوتك للغة العربية، لو الموقع شغال إنجليزي هيتكتب الكلام إنجليزي"
      : "The mic transcribes based on the site's current language";

  const handleSave = useCallback(async () => {
    if (!note) return;

    setSaveStatus("saving");

    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

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

  const { saveStatus, setSaveStatus } =
    useNoteSave({
      note,
      isEditing,
      handleSave,
    });

  const normalizeText = useCallback(
    (text: string) => {
      return text.replace(/\s+/g, " ").trim();
    },
    []
  );
  // الشرح الأول هو أن يتم تحويل النص إلى حروف صغيرة وإزالة المسافات والمسافات الخامة في النص  للتحقق من إنجاز مقارنة النص بشكل صحيح
  const normalizeForComparison =
    useCallback(
      (text: string) => {
        return normalizeText(text)
          .toLowerCase()
          .replace(/[.!؟?،,؛;:]+$/g, "")
          .trim();
      },
      [normalizeText]
    );

  const getOverlapText = useCallback(
    (
      existingText: string,
      incomingText: string
    ) => {
      const existing =
        normalizeText(existingText);
      const incoming =
        normalizeText(incomingText);

      if (!existing || !incoming) {
        return incoming;
      }

      const existingWords =
        existing.split(/\s+/);
      const incomingWords =
        incoming.split(/\s+/);

      const maxOverlap = Math.min(
        existingWords.length,
        incomingWords.length
      );

      for (
        let count = maxOverlap;
        count >= 1;
        count--
      ) {
        const oldPart = existingWords
          .slice(-count)
          .join(" ");

        const newPart = incomingWords
          .slice(0, count)
          .join(" ");

        if (
          normalizeForComparison(oldPart) ===
          normalizeForComparison(newPart)
        ) {
          return incomingWords
            .slice(count)
            .join(" ")
            .trim();
        }
      }

      return incoming;
    },
    [normalizeText, normalizeForComparison]
  );

  const appendFinalText = useCallback(
    (text: string) => {
      const cleanText =
        normalizeText(text);

      if (!cleanText) {
        return;
      }

      const normalizedIncoming =
        normalizeForComparison(cleanText);

      const normalizedLast =
        normalizeForComparison(
          lastAppendedFinalRef.current
        );

      if (
        normalizedIncoming &&
        normalizedIncoming === normalizedLast
      ) {
        return;
      }

      setNote((prev) => {
        if (!prev) {
          return null;
        }

        const currentContent =
          normalizeText(prev.content || "");

        let textToAdd = cleanText;

        if (currentContent) {
          textToAdd = getOverlapText(
            currentContent,
            textToAdd
          );
        }

        textToAdd =
          normalizeText(textToAdd);

        if (!textToAdd) {
          return prev;
        }

        const currentNormalized =
          normalizeForComparison(
            currentContent
          );

        const incomingNormalized =
          normalizeForComparison(
            textToAdd
          );

        if (
          incomingNormalized &&
          currentNormalized.endsWith(
            incomingNormalized
          )
        ) {
          return prev;
        }

        return {
          ...prev,
          content: currentContent
            ? `${currentContent} ${textToAdd}`
            : textToAdd,
        };
      });

      lastAppendedFinalRef.current =
        cleanText;

      setIsEditing(true);
      setSaveStatus("unsaved");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      normalizeText,
      normalizeForComparison,
      getOverlapText,
    ]
  );

  const startRecognition = useCallback(() => {
    const recognition =
      recognitionRef.current;

    if (!recognition) {
      return;
    }

    if (
      !shouldKeepRecordingRef.current
    ) {
      return;
    }

    if (
      startingRecognitionRef.current
    ) {
      return;
    }

    startingRecognitionRef.current = true;

    try {
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      startingRecognitionRef.current =
        false;

      console.error(
        "Speech recognition start error:",
        error
      );

      if (
        shouldKeepRecordingRef.current
      ) {
        if (
          restartTimerRef.current
        ) {
          clearTimeout(
            restartTimerRef.current
          );
        }

        restartTimerRef.current =
          setTimeout(() => {
            restartTimerRef.current =
              null;

            if (
              shouldKeepRecordingRef.current
            ) {
              startRecognition();
            }
          }, 500);
      }
    }
  }, []);

  const handleRecordStart = () => {
    if (isRecording) {
      shouldKeepRecordingRef.current =
        false;

      if (restartTimerRef.current) {
        clearTimeout(
          restartTimerRef.current
        );

        restartTimerRef.current = null;
      }

      try {
        recognitionRef.current?.stop();
      } catch (error) {
        console.error(
          "Speech recognition stop error:",
          error
        );
      }

      setIsRecording(false);
      setInterimText("");

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
      alert(
        formatMessage({
          id: "note.speechUnsupported",
        })
      );

      return;
    }

    if (restartTimerRef.current) {
      clearTimeout(
        restartTimerRef.current
      );

      restartTimerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore.
    }

    finalResultsRef.current = {};
    finalResultOrderRef.current = [];
    lastAppendedFinalRef.current = "";

    startingRecognitionRef.current =
      false;

    restartingRecognitionRef.current =
      false;

    shouldKeepRecordingRef.current =
      true;

    setInterimText("");

    const recognition =
      new SpeechRecognitionAPI();

    recognition.lang =
      lang === "ar"
        ? "ar-EG"
        : "en-US";

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (
      event: SpeechRecognitionEvent
    ) => {
      let interim = "";

      const startIndex =
        Math.max(
          0,
          event.resultIndex
        );

      for (
        let i = startIndex;
        i < event.results.length;
        i++
      ) {
        const result =
          event.results[i];

        if (
          !result ||
          !result[0]
        ) {
          continue;
        }

        const transcript =
          normalizeText(
            result[0].transcript || ""
          );

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          const previous =
            finalResultsRef.current[i];

          const currentNormalized =
            normalizeForComparison(
              transcript
            );

          const previousNormalized =
            normalizeForComparison(
              previous || ""
            );

          if (
            previous &&
            currentNormalized ===
              previousNormalized
          ) {
            continue;
          }

          if (
            previous &&
            transcript.startsWith(
              previous
            )
          ) {
            const difference =
              transcript
                .slice(previous.length)
                .trim();

            finalResultsRef.current[i] =
              transcript;

            if (difference) {
              appendFinalText(
                difference
              );
            }
          } else if (!previous) {
            finalResultsRef.current[i] =
              transcript;

            finalResultOrderRef.current.push(
              i
            );

            appendFinalText(
              transcript
            );
          } else {
            finalResultsRef.current[i] =
              transcript;

            const overlap =
              getOverlapText(
                previous,
                transcript
              );

            if (
              overlap &&
              normalizeForComparison(
                overlap
              ) !==
                normalizeForComparison(
                  previous
                )
            ) {
              appendFinalText(
                overlap
              );
            }
          }
        } else {
          interim += ` ${transcript}`;
        }
      }

      setInterimText(
        normalizeText(interim)
      );
    };

    recognition.onerror = (
      event: SpeechRecognitionErrorEvent
    ) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      startingRecognitionRef.current =
        false;

      if (
        event.error ===
          "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        shouldKeepRecordingRef.current =
          false;

        setIsRecording(false);
        setInterimText("");

        toast.error(
          formatMessage({
            id: "note.speechUnsupported",
          })
        );

        return;
      }

      if (
        event.error ===
          "no-speech" ||
        event.error ===
          "network" ||
        event.error ===
          "audio-capture"
      ) {
        setIsRecording(
          shouldKeepRecordingRef.current
        );
      }
    };

    recognition.onend = () => {
      startingRecognitionRef.current =
        false;

      setInterimText("");

      if (
        !shouldKeepRecordingRef.current
      ) {
        setIsRecording(false);
        return;
      }

      setIsRecording(true);

      if (
        restartingRecognitionRef.current
      ) {
        return;
      }

      restartingRecognitionRef.current =
        true;

      if (restartTimerRef.current) {
        clearTimeout(
          restartTimerRef.current
        );
      }

      restartTimerRef.current =
        setTimeout(() => {
          restartTimerRef.current =
            null;

          restartingRecognitionRef.current =
            false;

          if (
            shouldKeepRecordingRef.current
          ) {
            startRecognition();
          }
        }, 300);
    };

    recognitionRef.current =
      recognition;

    startRecognition();
  };

  useEffect(() => {
    return () => {
      shouldKeepRecordingRef.current =
        false;

      startingRecognitionRef.current =
        false;

      restartingRecognitionRef.current =
        false;

      if (restartTimerRef.current) {
        clearTimeout(
          restartTimerRef.current
        );

        restartTimerRef.current = null;
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore.
      }

      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fetchNote = async () => {
      if (id) {
        const fetchedNote =
          await getNote(id);

        if (fetchedNote) {
          setNote(fetchedNote);
        }

        setIsLoading(false);
      }
    };

    fetchNote();
  }, [id, getNote]);

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

  const handleDelete = async () => {
    if (!note) return;

    const sucsess =
      await deleteNote(note.id);

    if (sucsess) {
      navigate(path("/"));

      toast.success(
        formatMessage({
          id: "toast.deleted",
        })
      );
    }
  };

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
      const token =
        await getToken();

      if (!token) {
        throw new Error(
          formatMessage({
            id: "toast.loginRequired",
          })
        );
      }

      const summary =
        await summarizeText(
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
      const token =
        await getToken();

      if (!token) {
        throw new Error(
          formatMessage({
            id: "toast.loginRequired",
          })
        );
      }

      const rewritten =
        await rewriteText(
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

  const handleTranslate =
    async () => {
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
        const token =
          await getToken();

        if (!token) {
          throw new Error(
            formatMessage({
              id: "toast.loginRequired",
            })
          );
        }

        const isArabic =
          /[\u0600-\u06FF]/.test(
            note.content
          );

        const targetLang =
          isArabic
            ? "English"
            : "Arabic";

        const translation =
          await translateText(
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

  if (isLoading && !note) {
    return (
      <div className="flex justify-center items-center py-20 w-full">
        <Loader className="animate-spin h-10 w-10 text-black dark:text-white" />
      </div>
    );
  }

  const isArabicContent =
    note?.content
      ? /[\u0600-\u06FF]/.test(
          note.content
        )
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
                isRtl
                  ? "rotate-180"
                  : ""
              }
            />

            {formatMessage({
              id: "note.back",
            })}
          </Button>

          <AutoSave
            saveStatus={saveStatus}
          />
        </div>

        <div>
          <DeleteBtn
            handleDelete={
              handleDelete
            }
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
              onClick={
                handleRecordStart
              }
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
                toast.info(
                  micTooltipText
                )
              }
              className="flex items-center justify-center h-6 w-6 rounded-full
                         text-muted-foreground hover:text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={
              handleSummarize
            }
            disabled={
              aiLoading !== null
            }
            variant="outline"
          >
            <Sparkles />

            {formatMessage({
              id:
                aiLoading ===
                "summarize"
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
            onClick={
              handleTranslate
            }
            disabled={
              aiLoading !== null
            }
          >
            <Languages />

            {formatMessage({
              id:
                aiLoading ===
                "translate"
                  ? "note.translating"
                  : "note.translate",
            })}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          value={
            note?.title || ""
          }
          placeholder={formatMessage({
            id: "note.titlePlaceholder",
          })}
          onChange={handleChange}
          className="focus-plain w-full bg-transparent text-4xl! p-2 h-15 font-bold"
        />

        {isRecording &&
          interimText && (
            <p className="hidden sm:block text-sm text-muted-foreground italic animate-pulse">
              {interimText}
            </p>
          )}

        <Textarea
          placeholder={formatMessage({
            id: "note.contentPlaceholder",
          })}
          value={
            note?.content || ""
          }
          rows={30}
          onChange={
            handleTextareaChange
          }
          dir={
            isArabicContent ||
            isRtl
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

