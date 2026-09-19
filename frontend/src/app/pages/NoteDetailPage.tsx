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
import { summarizeText, rewriteText, translateText, type RewriteMode } from  "@/hooks/useAi";
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

  // Mic tooltip text, hardcoded (no translation files needed)
  const micTooltipText =
    lang === "ar"
      ? "المايك بينقل صوتك للغة العربية، لو الموقع شغال إنجليزي هيتكتب الكلام إنجليزي"
      : "The mic transcribes based on the site's current language";

  const handleSave = useCallback(async () => {
    if (!note) return;
    setSaveStatus("saving");

    const minDelay = new Promise((resolve) => setTimeout(resolve, 500));
    const [updatedNote] = await Promise.all([
      saveNote(note.id, { title: note.title, content: note.content }),
      minDelay,
    ]);

    if (updatedNote) {
      setNote(updatedNote);
      setIsEditing(false);
      setSaveStatus("saved");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, saveNote]);
  const { saveStatus, setSaveStatus } = useNoteSave({ note, isEditing, handleSave });
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang === "ar" ? "ar-EG" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (finalText) {
        setNote((prev) =>
          prev ? { ...prev, content: prev.content + " " + finalText } : null,
        );
        setIsEditing(true);
      }

      setInterimText(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;
    setNote((prev) => (prev ? { ...prev, title: e.target.value } : null));
    setIsEditing(true);
    setSaveStatus("unsaved");
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!note) return;
    setNote((prev) => (prev ? { ...prev, content: e.target.value } : null));
    setIsEditing(true);
    setSaveStatus("unsaved");
  };

  const handleDelete = async () => {
    if (!note) return;
    const sucsess = await deleteNote(note.id);
    if (sucsess) {
      navigate(path("/"));
      toast.success(formatMessage({ id: "toast.deleted" }));
    }
  };

  const handleSummarize = async () => {
    if (!note?.content) {
      toast.error(formatMessage({ id: "toast.noTextSummarize" }));
      return;
    }
    setAiLoading("summarize");
    try {
      const token = await getToken();
      if (!token) throw new Error(formatMessage({ id: "toast.loginRequired" }));
      const summary = await summarizeText(token, note.content);
      setNote((prev) => (prev ? { ...prev, content: summary } : null));
      setIsEditing(true);
      setSaveStatus("unsaved");
      toast.success(formatMessage({ id: "toast.summaryDone" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : formatMessage({ id: "toast.summarizeFailed" }));
    } finally {
      setAiLoading(null);
    }
  };

  const handleRewrite = async (mode: RewriteMode) => {
    if (!note?.content) {
      toast.error(formatMessage({ id: "toast.noTextRewrite" }));
      return;
    }
    setAiLoading("rewrite");
    try {
      const token = await getToken();
      if (!token) throw new Error(formatMessage({ id: "toast.loginRequired" }));
      const rewritten = await rewriteText(token, note.content, mode);
      setNote((prev) => (prev ? { ...prev, content: rewritten } : null));
      setIsEditing(true);
      setSaveStatus("unsaved");
      toast.success(formatMessage({ id: "toast.rewriteDone" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : formatMessage({ id: "toast.rewriteFailed" }));
    } finally {
      setAiLoading(null);
    }
  };

const handleTranslate = async () => {
  if (!note?.content) {
    toast.error(formatMessage({ id: "toast.noTextTranslate" }));
    return;
  }
  setAiLoading("translate");
  try {
    const token = await getToken();
    if (!token) throw new Error(formatMessage({ id: "toast.loginRequired" }));
    const isArabic = /[\u0600-\u06FF]/.test(note.content);
    const targetLang = isArabic ? "English" : "Arabic";

    const translation = await translateText(token, note.content, targetLang);
    setNote((prev) => (prev ? { ...prev, content: translation } : null));
    setIsEditing(true);
    setSaveStatus("unsaved");
    toast.success(formatMessage({ id: "toast.translateDone" }));
  } catch (err) {
    toast.error(err instanceof Error ? err.message : formatMessage({ id: "toast.translateFailed" }));
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
const isArabicContent = note?.content ? /[\u0600-\u06FF]/.test(note.content) : false;
  return (
    <GlassCard className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 items-center">
          <Button className="w-fit" onClick={handleClick} variant="outline">
            <ArrowLeft className={isRtl ? "rotate-180" : ""} /> {formatMessage({ id: "note.back" })}
          </Button>
          <AutoSave saveStatus={saveStatus} />
        </div>
        <div>
          <DeleteBtn
            handleDelete={handleDelete}
            title={formatMessage({ id: "note.deleteTitle" })}
            content={formatMessage({ id: "note.deleteContent" })}
          />
        </div>
      </div>
      <div className="flex justify-between items-center ">
        <div className="flex gap-2 btn-group flex-wrap  ">
          <div className="inline-flex items-center gap-1">
            <Button
              onClick={handleRecordStart}
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? <span className="animate-pulse">🔴</span> : <Mic />}
              <span>{formatMessage({ id: isRecording ? "note.recording" : "note.speak" })}</span>
            </Button>

            {/* Info button: shows a toast with the mic explanation, works on mobile and desktop */}
            <button
              type="button"
              aria-label="info"
              onClick={() => toast.info(micTooltipText)}
              className="flex items-center justify-center h-6 w-6 rounded-full
                         text-muted-foreground hover:text-foreground
                         focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <Button onClick={handleSummarize} disabled={aiLoading !== null} variant="outline">
            <Sparkles />
            {formatMessage({ id: aiLoading === "summarize" ? "note.summarizing" : "note.summarize" })}
          </Button>

          <Rewrite 
            value={rewriteMode}
            onValueChange={(mode) => {
              setRewriteMode(mode);
              handleRewrite(mode);
            }}
          />

          <Button onClick={handleTranslate} disabled={aiLoading !== null}>
            <Languages />
            {formatMessage({ id: aiLoading === "translate" ? "note.translating" : "note.translate" })}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 ">
        <Input
          value={note?.title || ""}
          placeholder={formatMessage({ id: "note.titlePlaceholder" })}
          onChange={handleChange}
          className="focus-plain w-full  bg-transparent text-4xl! p-2 h-15  font-bold"
        />
        {isRecording && interimText && (
          <p className="text-sm text-muted-foreground italic animate-pulse">
            {interimText}
          </p>
        )}
        <Textarea
  placeholder={formatMessage({ id: "note.contentPlaceholder" })}
  value={note?.content || ""}
  rows={30}
  onChange={handleTextareaChange}
  dir={isArabicContent || isRtl ? "rtl" : "ltr"}
  className="focus-plain w-full !border-none bg-transparent dark:bg-transparent min-h-[400px]  "
/>
      </div>
    </GlassCard>
  );
}

export default NoteDetailPage;