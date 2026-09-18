import Groq from "groq-sdk";
import { config } from "../config/env";

const groq = new Groq({
  apiKey: config.groq.apiKey,
});

const MODEL = config.groq.model;

export type RewriteMode = "comedy" | "formal" | "casual";

export async function summarizeText(text: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: "You are a summarization assistant. Summarize the given text concisely and clearly, in the same language as the original text." },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });
  return completion.choices[0].message.content ?? "";
}

export async function rewriteText(text: string, mode: RewriteMode): Promise<string> {
  const modePrompts: Record<RewriteMode, string> = {
    comedy: "Rewrite the following text in a funny, humorous tone.",
    formal: "Rewrite the following text in a formal, professional tone.",
    casual: "Rewrite the following text in a casual, relaxed tone.",
  };

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: `${modePrompts[mode]} Keep the same original language as the text, and respond with only the rewritten text, no extra explanation.` },
      { role: "user", content: text },
    ],
    temperature: 0.5,
  });
  return completion.choices[0].message.content ?? "";
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: `Translate the following text into ${targetLang}. Respond with only the translated text, no extra explanation.` },
      { role: "user", content: text },
    ],
    temperature: 0.3,
  });
  return completion.choices[0].message.content ?? "";
}