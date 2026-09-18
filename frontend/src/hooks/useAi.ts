const API_BASE_URL = "http://localhost:3001/api/ai";

export type RewriteMode = "comedy" | "formal" | "casual";

async function callAI<T>(
  endpoint: string,
  token: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function summarizeText(token: string, text: string): Promise<string> {
  const data = await callAI<{ summary: string }>("summarize", token, { text });
  return data.summary;
}

export async function rewriteText(
  token: string,
  text: string,
  mode: RewriteMode
): Promise<string> {
  const data = await callAI<{ rewritten: string }>("rewrite", token, { text, mode });
  return data.rewritten;
}

export async function translateText(
  token: string,
  text: string,
  targetLang: string
): Promise<string> {
  const data = await callAI<{ translation: string }>("translate", token, {
    text,
    targetLang,
  });
  return data.translation;
}