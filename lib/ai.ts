// Optional AI assist for compiling scattered group answers into flowing report text.
// Returns null when no ANTHROPIC_API_KEY is configured — callers should fall back
// to the raw finalized text in that case.
export async function aiCompile(sections: { label: string; content: string }[]): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const prompt =
    "以下是護理系學生小組完成的「學習者評估」報告各段落定稿內容。請你只做文字整理與銜接（合併重複、修順語句），" +
    "不要新增學生沒寫過的事實或資料，也不要刪減他們的原意。用繁體中文輸出，維持段落標題。\n\n" +
    sections.map((s) => `【${s.label}】\n${s.content}`).join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = (data.content || []).map((b: any) => b.text || "").join("\n");
  return text || null;
}
