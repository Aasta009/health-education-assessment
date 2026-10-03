// Calls Google's Gemini API to compare the group's AI-iteration result (A)
// against their activity plan (B) and flag any inconsistencies. This is a
// consistency checker, not a content generator — it never writes the
// students' content for them.
// Primary model first, then a fallback if the primary is persistently
// overloaded (503) — new models often see heavy launch-day demand spikes.
// Both configurable via env vars without a code change.
const MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.8-flash",
  process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash",
];

function endpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 未設定");
  return key;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOnce(model: string, prompt: string): Promise<{ ok: true; text: string; raw: string } | { ok: false; status: number; raw: string }> {
  const res = await fetch(endpoint(model), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  const raw = await res.text();
  if (!res.ok) return { ok: false, status: res.status, raw };
  const data = JSON.parse(raw);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { ok: false, status: 0, raw: "Gemini 沒有回傳內容" };
  return { ok: true, text, raw };
}

// Google's Gemini endpoint intermittently returns 503 ("high demand") or 429
// (rate limit) — both are transient, so retry a couple of times per model,
// then fall through to the next model in MODELS, before giving up.
async function callGemini(prompt: string): Promise<{ text: string; raw: string }> {
  let lastErr: Error | null = null;

  for (const model of MODELS) {
    const attemptsForThisModel = 2;
    for (let attempt = 1; attempt <= attemptsForThisModel; attempt++) {
      const result = await callOnce(model, prompt);
      if (result.ok === true) {
        return { text: result.text, raw: result.raw };
      } else {
        const transient = result.status === 503 || result.status === 429;
        lastErr = new Error(`Gemini API 錯誤 (${model}${result.status ? `, ${result.status}` : ""}): ${result.raw.slice(0, 500)}`);
        if (!transient) break; // non-transient — no point retrying this model
        if (attempt < attemptsForThisModel) await sleep(attempt * 1500);
      }
    }
  }
  throw lastErr || new Error("Gemini API 呼叫失敗");
}

function extractJson(text: string): any {
  // Gemini sometimes wraps JSON in ```json fences even when asked not to.
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function checkConsistency(aText: string, bText: string): Promise<{ issues: string[]; raw: string }> {
  const prompt =
    "你是護理教育課程的助教，負責一致性檢核，不是幫學生撰寫內容。\n" +
    "請比較以下兩份文件：\n" +
    "A文件是學生與AI討論後，對學習者（國小學童）評估的最終結果（學習需求、學習準備度、學習風格、教學環境、教學者評估等）。\n" +
    "B文件是學生自行撰寫的「學習者評估活動規劃書」（活動主題、規劃說明、流程、工作分配、道具）。\n" +
    "請檢查B的活動設計是否真的對應、呼應A裡面提到的重點，找出所有邏輯不一致、未對應、矛盾或遺漏呼應的地方。\n" +
    "請只回傳 JSON，格式為 {\"issues\": [\"問題描述1\", \"問題描述2\"]}，每一條問題描述請具體指出是A的哪個重點跟B的哪個部分對不上。\n" +
    "如果完全一致、沒有問題，回傳 {\"issues\": []}。不要回傳其他文字或 markdown。\n\n" +
    `【A文件：AI迭代後最終結果】\n${aText}\n\n【B文件：活動規劃書】\n${bText}`;

  const { text, raw } = await callGemini(prompt);
  const parsed = extractJson(text);
  const issues = Array.isArray(parsed?.issues) ? parsed.issues.filter((x: any) => typeof x === "string" && x.trim()) : [];
  return { issues, raw };
}

export async function recheckItem(aText: string, bText: string, issueText: string): Promise<{ resolved: boolean; explanation: string; raw: string }> {
  const prompt =
    "你是護理教育課程的助教，負責一致性檢核複查。\n" +
    `之前檢核時提出以下問題：「${issueText}」\n` +
    "學生表示已經修改了活動規劃書。請重新比對最新的A、B文件，判斷這個問題是否已經解決。\n" +
    "請只回傳 JSON，格式為 {\"resolved\": true 或 false, \"explanation\": \"說明\"}。\n" +
    "若 resolved 為 false，explanation 請具體說明目前還有什麼地方沒對應上（這段文字會直接顯示給學生看，取代原本的問題描述）。\n" +
    "若 resolved 為 true，explanation 簡短說明為什麼現在算對應上了即可。不要回傳其他文字或 markdown。\n\n" +
    `【A文件：AI迭代後最終結果】\n${aText}\n\n【B文件：活動規劃書（最新版）】\n${bText}`;

  const { text, raw } = await callGemini(prompt);
  const parsed = extractJson(text);
  return { resolved: !!parsed?.resolved, explanation: String(parsed?.explanation || ""), raw };
}
