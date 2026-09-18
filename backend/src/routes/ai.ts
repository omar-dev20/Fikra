import { Router, Request, Response } from "express";
import { summarizeText, rewriteText, translateText } from "../services/groqService";
import { summarizeSchema, rewriteSchema, translateSchema } from "../validators/ai.schema";
import { notesService } from "../services/notes.service";
import { Note } from "../models/Note";

const router = Router();

async function resolveText(userId: string, noteId?: string, text?: string): Promise<string> {
  if (text) return text;
  if (noteId) {
    const note = await notesService.findByIdAndUserId(noteId, userId);
    return note.content;
  }
  throw new Error("No text or noteId provided");
}

router.post("/summarize", async (req: Request, res: Response) => {
  try {
    const parsed = summarizeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { noteId, text } = parsed.data;
    const resolvedText = await resolveText(userId, noteId, text);

    const summary = await summarizeText(resolvedText);

    if (noteId) {
      await Note.update({ summary }, { where: { id: noteId, userId } });
    }

    res.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = (err as any).statusCode || 500;
    res.status(status).json({ error: message });
  }
});

router.post("/rewrite", async (req: Request, res: Response) => {
  try {
    const parsed = rewriteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { noteId, text, mode } = parsed.data;
    const resolvedText = await resolveText(userId, noteId, text);

    const rewritten = await rewriteText(resolvedText, mode);
    res.json({ rewritten });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = (err as any).statusCode || 500;
    res.status(status).json({ error: message });
  }
});

router.post("/translate", async (req: Request, res: Response) => {
  try {
    const parsed = translateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { noteId, text, targetLang } = parsed.data;
    const resolvedText = await resolveText(userId, noteId, text);

    const translation = await translateText(resolvedText, targetLang);
    res.json({ translation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = (err as any).statusCode || 500;
    res.status(status).json({ error: message });
  }
});

export default router;