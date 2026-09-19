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
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldKeepRecordingRef = useRef(false);
  const startingRecognitionRef = useRef(false);
  const restartingRecognitionRef = useRef(false);

  const previousFinalTextRef = useRef("");
  const lastAddedTextRef = useRef("");
  const accumulatedSpeechRef = useRef("");
  const lastResultTimeRef = useRef(0);

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

  const normalizeText = useCallback((text: string) => {
    return text
      .replace(/\s+/g, " ")
      .replace(/[،,]+/g, ",")
      .trim();
  }, []);

  const normalizeForComparison = useCallback((text: string) => {
    return normalizeText(text)
      .toLowerCase()
      .replace(/[.!؟?،,؛;:]+$/g, "")
      .trim();
  }, [normalizeText]);

  const splitWords = useCallback(
    (text: string) => {
      return normalizeText(text)
        .split(/\s+/)
        .filter(Boolean);
    },
    [normalizeText]
  );

  const isSameOrRepeatedText = useCallback(
    (existingText: string, incomingText: string) => {
      const existing = normalizeForComparison(existingText);
      const incoming = normalizeForComparison(incomingText);

      if (!existing || !incoming) {
        return false;
      }

      if (existing === incoming) {
        return true;
      }

      if (existing.endsWith(incoming)) {
        return true;
      }

      if (incoming.endsWith(existing)) {
        return true;
      }

      if (
        incoming.length > 20 &&
        existing.includes(incoming)
      ) {
        return true;
      }

      return false;
    },
    [normalizeForComparison]
  );

  const removeDuplicateOverlap = useCallback(
    (existingText: string, incomingText: string) => {
      const existing = normalizeText(existingText);
      const incoming = normalizeText(incomingText);

      if (!existing || !incoming) {
        return incoming;
      }

      const existingWords = splitWords(existing);
      const incomingWords = splitWords(incoming);

      if (!existingWords.length || !incomingWords.length) {
        return incoming;
      }

      const maxOverlap = Math.min(
        existingWords.length,
        incomingWords.length
      );

      for (let count = maxOverlap; count >= 1; count--) {
        const existingPart = existingWords
          .slice(-count)
          .join(" ");

        const incomingPart = incomingWords
          .slice(0, count)
          .join(" ");

        if (
          normalizeForComparison(existingPart) ===
          normalizeForComparison(incomingPart)
        ) {
          return incomingWords
            .slice(count)
            .join(" ")
            .trim();
        }
      }

      return incoming;
    },
    [normalizeText, splitWords, normalizeForComparison]
  );

  const removeRepeatedSentences = useCallback(
    (text: string) => {
      const normalized = normalizeText(text);

      if (!normalized) {
        return "";
      }

      const parts = normalized
        .split(/(?<=[.!؟?])\s+/)
        .map((part) => part.trim())
        .filter(Boolean);

      if (parts.length <= 1) {
        return normalized;
      }

      const uniqueParts: string[] = [];

      for (const part of parts) {
        const comparison = normalizeForComparison(part);

        if (!comparison) {
          continue;
        }

        const alreadyExists = uniqueParts.some(
          (existing) =>
            normalizeForComparison(existing) === comparison
        );

        if (!alreadyExists) {
          uniqueParts.push(part);
        }
      }

      return uniqueParts.join(" ").trim();
    },
    [normalizeText, normalizeForComparison]
  );

  const removeRepeatedWords = useCallback(
    (text: string) => {
      const words = splitWords(text);

      if (words.length < 2) {
        return normalizeText(text);
      }

      const result: string[] = [];

      for (let i = 0; i < words.length; i++) {
        const current = normalizeForComparison(words[i]);
        const previous =
          i > 0
            ? normalizeForComparison(words[i - 1])
            : "";

        if (current && current === previous) {
          continue;
        }

        result.push(words[i]);
      }

      return result.join(" ").trim();
    },
    [splitWords, normalizeForComparison, normalizeText]
  );

  const cleanIncomingSpeech = useCallback(
    (text: string) => {
      let cleaned = normalizeText(text);

      if (!cleaned) {
        return "";
      }

      cleaned = removeRepeatedWords(cleaned);
      cleaned = removeRepeatedSentences(cleaned);

      return normalizeText(cleaned);
    },
    [normalizeText, removeRepeatedWords, removeRepeatedSentences]
  );

  const getNewSpeechPart = useCallback(
    (oldText: string, newText: string) => {
      const oldNormalized = normalizeText(oldText);
      const newNormalized = normalizeText(newText);

      if (!newNormalized) {
        return "";
      }

      if (!oldNormalized) {
        return newNormalized;
      }

      if (oldNormalized === newNormalized) {
        return "";
      }

      if (newNormalized.startsWith(oldNormalized)) {
        return newNormalized
          .slice(oldNormalized.length)
          .trim();
      }

      const oldWords = splitWords(oldNormalized);
      const newWords = splitWords(newNormalized);

      const maxOverlap = Math.min(
        oldWords.length,
        newWords.length
      );

      for (let count = maxOverlap; count >= 1; count--) {
        const oldPart = oldWords
          .slice(-count)
          .join(" ");

        const newPart = newWords
          .slice(0, count)
          .join(" ");

        if (
          normalizeForComparison(oldPart) ===
          normalizeForComparison(newPart)
        ) {
          return newWords
            .slice(count)
            .join(" ")
            .trim();
        }
      }

      if (
        oldNormalized.includes(newNormalized) ||
        newNormalized.includes(oldNormalized)
      ) {
        return "";
      }

      return newNormalized;
    },
    [
      normalizeText,
      splitWords,
      normalizeForComparison,
    ]
  );

  const appendSpeechText = useCallback(
    (speechText: string) => {
      const cleanedSpeech =
        cleanIncomingSpeech(speechText);

      if (!cleanedSpeech) {
        return;
      }

      setNote((prev) => {
        if (!prev) {
          return null;
        }

        const currentContent =
          normalizeText(prev.content || "");

        const lastAdded =
          normalizeText(lastAddedTextRef.current);

        if (
          lastAdded &&
          isSameOrRepeatedText(
            lastAdded,
            cleanedSpeech
          )
        ) {
          return prev;
        }

        if (
          currentContent &&
          isSameOrRepeatedText(
            currentContent,
            cleanedSpeech
          )
        ) {
          return prev;
        }

        let textToAppend = cleanedSpeech;

        if (currentContent) {
          textToAppend = removeDuplicateOverlap(
            currentContent,
            textToAppend
          );
        }

        textToAppend =
          removeDuplicateOverlap(
            accumulatedSpeechRef.current,
            textToAppend
          );

        textToAppend =
          cleanIncomingSpeech(textToAppend);

        if (!textToAppend) {
          return prev;
        }

        const currentWords = splitWords(
          currentContent
        );

        const incomingWords = splitWords(
          textToAppend
        );

        if (
          currentWords.length > 0 &&
          incomingWords.length > 0
        ) {
          const currentTail = currentWords
            .slice(-Math.min(8, currentWords.length))
            .join(" ");

          const incomingHead = incomingWords
            .slice(0, Math.min(8, incomingWords.length))
            .join(" ");

          if (
            normalizeForComparison(currentTail) ===
            normalizeForComparison(incomingHead)
          ) {
            textToAppend = incomingWords
              .slice(
                Math.min(8, incomingWords.length)
              )
              .join(" ");
          }
        }

        textToAppend =
          cleanIncomingSpeech(textToAppend);

        if (!textToAppend) {
          return prev;
        }

        accumulatedSpeechRef.current =
          normalizeText(
            `${accumulatedSpeechRef.current} ${textToAppend}`
          );

        lastAddedTextRef.current =
          textToAppend;

        return {
          ...prev,
          content: currentContent
            ? `${currentContent} ${textToAppend}`
            : textToAppend,
        };
      });

      setIsEditing(true);
      setSaveStatus("unsaved");
    },
    [
      cleanIncomingSpeech,
      normalizeText,
      isSameOrRepeatedText,
      removeDuplicateOverlap,
      splitWords,
      normalizeForComparison,
    ]
  );

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    if (
      startingRecognitionRef.current ||
      restartingRecognitionRef.current
    ) {
      return;
    }

    startingRecognitionRef.current = true;

    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error(
        "Speech recognition start error:",
        error
      );

      startingRecognitionRef.current = false;

      if (shouldKeepRecordingRef.current) {
        restartingRecognitionRef.current = true;

        setTimeout(() => {
          restartingRecognitionRef.current = false;

          if (
            shouldKeepRecordingRef.current &&
            recognitionRef.current
          ) {
            startRecognition();
          }
        }, 400);
      } else {
        setIsRecording(false);
      }
    }
  }, []);

  const handleRecordStart = () => {
    if (isRecording) {
      shouldKeepRecordingRef.current = false;

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors.
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

    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore previous recognition errors.
    }

    previousFinalTextRef.current = "";
    lastAddedTextRef.current = "";
    accumulatedSpeechRef.current = "";
    lastResultTimeRef.current = 0;

    setInterimText("");

    shouldKeepRecordingRef.current = true;
    startingRecognitionRef.current = false;
    restartingRecognitionRef.current = false;

    const recognition =
      new SpeechRecognitionAPI();

    recognition.lang =
      lang === "ar" ? "ar-EG" : "en-US";

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (
      event: SpeechRecognitionEvent
    ) => {
      const now = Date.now();

      if (
        now - lastResultTimeRef.current <
        30
      ) {
        return;
      }

      lastResultTimeRef.current = now;

      let fullFinalText = "";
      let interim = "";

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];

        if (!result || !result[0]) {
          continue;
        }

        const transcript =
          result[0].transcript || "";

        if (result.isFinal) {
          fullFinalText += ` ${transcript}`;
        } else {
          interim += ` ${transcript}`;
        }
      }

      fullFinalText =
        normalizeText(fullFinalText);

      interim = normalizeText(interim);

      if (fullFinalText) {
        const previousFinal =
          previousFinalTextRef.current;

        if (
          fullFinalText !== previousFinal
        ) {
          const newPart =
            getNewSpeechPart(
              previousFinal,
              fullFinalText
            );

          if (newPart) {
            const cleaned =
              cleanIncomingSpeech(newPart);

            if (cleaned) {
              appendSpeechText(cleaned);
            }
          }

          previousFinalTextRef.current =
            fullFinalText;
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

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        shouldKeepRecordingRef.current = false;
        setIsRecording(false);
        setInterimText("");

        toast.error(
          formatMessage({
            id: "note.speechUnsupported",
          })
        );

        return;
      }

      if (event.error === "aborted") {
        return;
      }

      if (
        event.error === "no-speech" ||
        event.error === "network" ||
        event.error === "audio-capture"
      ) {
        if (
          shouldKeepRecordingRef.current
        ) {
          setTimeout(() => {
            if (
              shouldKeepRecordingRef.current
            ) {
              startRecognition();
            }
          }, 500);
        }
      }
    };

    recognition.onend = () => {
      startingRecognitionRef.current = false;

      if (
        shouldKeepRecordingRef.current
      ) {
        setIsRecording(true);
        setInterimText("");

        if (
          restartingRecognitionRef.current
        ) {
          return;
        }

        restartingRecognitionRef.current = true;

        setTimeout(() => {
          restartingRecognitionRef.current = false;

          if (
            shouldKeepRecordingRef.current &&
            recognitionRef.current === recognition
          ) {
            try {
              recognition.start();
              startingRecognitionRef.current = true;
              setIsRecording(true);
            } catch (error) {
              console.error(
                "Speech recognition restart error:",
                error
              );

              startingRecognitionRef.current =
                false;

              if (
                shouldKeepRecordingRef.current
              ) {
                setTimeout(() => {
                  if (
                    shouldKeepRecordingRef.current
                  ) {
                    startRecognition();
                  }
                }, 700);
              }
            }
          }
        }, 250);
      } else {
        setIsRecording(false);
        setInterimText("");
      }
    };

    recognitionRef.current = recognition;

    startRecognition();
  };

  useEffect(() => {
    return () => {
      shouldKeepRecordingRef.current = false;
      startingRecognitionRef.current = false;
      restartingRecognitionRef.current = false;

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }

      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fetchNote = async () => {
      if (id) {
        const fetchedNote = await getNote(id);

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
        /[\u0600-\u06FF]/.test(
          note.content
        );

      const targetLang = isArabic
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

  const isArabicContent = note?.content
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
            onClick={handleSummarize}
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
            onClick={handleTranslate}
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
          value={note?.title || ""}
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
          value={note?.content || ""}
          rows={30}
          onChange={
            handleTextareaChange
          }
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