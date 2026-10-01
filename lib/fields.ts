export type FieldConfig = {
  key: string;
  stage: 1;
  group: string; // section grouping for display
  label: string;
  prompt: string;
  multiline?: boolean;
  highlight?: boolean; // render label in bold red — used for scoring-critical fields
  skipIndividual?: boolean; // skip the "我的想法" individual-draft step, go straight to group final
};

export const FIELDS: FieldConfig[] = [
  // ---- 第一關：主題方向（僅需確認年級，1分鐘）----
  { key: "topic", stage: 1, group: "主題方向",
    label: "本組負責的年級與主題",
    prompt: "請確認你們這組負責哪個年級，點選即可，不需要個人填寫或組內定稿。" },

  // ---- 第二關：學習者評估內容規劃 ----
  { key: "need", stage: 1, group: "學習者評估內容規劃",
    label: "學習需求　評估內容規劃",
    prompt: "學習需求＝了解學童「原有的」及「想要的」知識、態度、技能之間的落差。\n參考 Panno(1992) 的三步驟來規劃：\n①了解學童現有的學習需求\n②分析學童「自己認為」的需求和「實際」需求之間的落差\n③排出評估內容的優先順序\n這群學童是國小三、四年級（約8-10歲），可參考課堂範例問題，例如（三年級）：「學童對失智症基本症狀的認識程度如何？」「能否區分失智症與其他健康問題？」（四年級）：「學童對於如何與失智症患者相處時應注意的事項的理解程度？」依你們的主題自訂類似問題。",
    multiline: true },
  { key: "ready", stage: 1, group: "學習者評估內容規劃",
    label: "學習準備度　評估內容規劃",
    prompt: "學習準備度包含四個面向，請分別想好怎麼評估（對象為三、四年級學童，約8-10歲，屬於「學齡期」）：\n・生理準備度：學齡期（6-11歲）學童已開始發展歸納／演繹推理能力，能進行合理的因果性推理，可依此設計評估方式\n・情緒準備度：這裡指的是焦慮程度與支持系統（家人、老師、同儕）——注意「學習動機」不算在情緒準備度裡，是另外要觀察的項目\n・經驗準備度：是否有相關主題的學習經驗、過去與長輩／失智症患者相處的經驗\n・知識準備度：先備知識、技能、態度、認知策略",
    multiline: true },
  { key: "style", stage: 1, group: "學習者評估內容規劃",
    label: "學習風格　評估內容規劃",
    prompt: "學習風格＝個人處理訊息的方式、學習過程中的偏好（Dunn & Dunn）。\n打算怎麼了解這群三、四年級學童偏好的學習方式？（例如：圖像／故事、遊戲操作、小組討論、角色扮演等，這個年紀的孩子通常對動手操作和遊戲化的方式反應較好）不同風格會影響你們之後活動規劃書要用的教學方法。",
    multiline: true },
  { key: "env", stage: 1, group: "學習者評估內容規劃",
    label: "教學環境　評估內容規劃",
    prompt: "打算怎麼評估國小現場的教學環境？可分兩類：\n・物理環境：明亮度、聲音／噪音、空調溫度、座位與桌椅排列、空間大小、設備（投影機、電腦、海報等）、地點便利性\n・心理環境：班級氣氛、師生互動、同儕合作氣氛",
    multiline: true },

  // ---- 第三關：訪談綱要（左右分欄：導師／護理師）----
  { key: "interview_teacher", stage: 1, group: "訪談綱要",
    label: "訪談綱要－導師",
    prompt: "由負責「導師」這一欄的 4 位組員填寫。想請教班級導師哪些問題？建議涵蓋：\n・這個班級目前失智症衛教現況（是否曾帶入相關議題、用什麼方式）\n・這群三、四年級學童的教學方法建議與學生特性（如專注力、理解力、特殊需求）\n・方便配合評估活動的時間",
    multiline: true },
  { key: "interview_nurse", stage: 1, group: "訪談綱要",
    label: "訪談綱要－護理師",
    prompt: "由負責「護理師」這一欄的 4 位組員填寫。想請教校護或社區護理師哪些問題？建議涵蓋：\n・國小目前失智症衛教現況與可運用的衛教資源\n・不同年級的衛教安排建議\n・與學童溝通失智症相關議題時的注意事項",
    multiline: true },

  // ---- 第四關：AI迭代結果（使用 NotebookLM，20分鐘）----
  { key: "ai_result", stage: 1, group: "AI迭代結果",
    label: "AI迭代後最終結果",
    prompt: "請把你們匯出的「組內討論結果」檔案放進 NotebookLM，依照提示詞請 AI 檢查評估規劃是否符合學習評估原則、有無需要修改之處，經過幾輪討論後，把最終版本貼在這裡（這是跟 AI 討論後的共同結果，不需要先各自填寫個人想法）。",
    multiline: true, skipIndividual: true },
  { key: "ai_reason", stage: 1, group: "AI迭代結果",
    label: "修改理由（為何採納或不採納 AI 的建議）",
    prompt: "請說明你們根據 AI 的建議做了哪些修改、為什麼這樣修改（或為什麼不採納某些建議）。這一項是評分重點，請務必詳細說明理由，不是只貼結果。",
    multiline: true, highlight: true },

  // ---- 第五關：活動規劃書（5個子項整合成一頁）----
  { key: "act_topic", stage: 1, group: "活動規劃書",
    label: "活動主題",
    prompt: "這次 30 分鐘「學習者評估活動」要怎麼命名？活動目的是蒐集資料做評估，不是正式衛教，取名時可以反映這一點。" },
  { key: "act_desc", stage: 1, group: "活動規劃書",
    label: "活動規劃說明",
    prompt: "簡述這個活動的設計理念：為什麼這樣設計？想從中蒐集到學習需求、準備度、學習風格、教學環境哪些資訊？跟你們選定的主題方向有什麼關聯？",
    multiline: true },
  { key: "act_flow", stage: 1, group: "活動規劃書",
    label: "活動流程（細流）",
    prompt: "請列出主要步驟與時間分配，30分鐘內需含「暖身」「評估活動主體」「收尾」。參考範例節奏：\n0-3分鐘｜暖身、自我介紹\n3-8分鐘｜引起動機（故事／提問）\n8-18分鐘｜評估活動主體（問答／遊戲／小組討論）\n18-25分鐘｜統整與觀察紀錄\n25-30分鐘｜收尾與致謝\n請依你們的活動內容調整各段落時間與具體做法。", multiline: true },
  { key: "act_roles", stage: 1, group: "活動規劃書",
    label: "工作分配（主持人、紀錄、工具準備等）",
    prompt: "誰負責什麼？建議至少分配：主持人（帶流程）、計時員、紀錄員（記錄學童反應）、道具／教具準備。" },
  { key: "act_props", stage: 1, group: "活動規劃書",
    label: "道具製作（若有）",
    prompt: "需要準備什麼道具或教具？例如故事卡、圖片、問卷、小遊戲教具等，依活動流程所需列出。" },
];

export const STAGE1_KEYS = FIELDS.map(f => f.key);
export const ALL_KEYS = FIELDS.map(f => f.key);

export function getField(key: string): FieldConfig | undefined {
  return FIELDS.find(f => f.key === key);
}

// Which groups are shown as one consolidated multi-column page instead of
// linking to individual /s/field/[key] pages.
export const CONSOLIDATED_GROUPS: Record<string, string> = {
  "主題方向": "/s", // checkbox-only selection, lives inline on the journey map
  "訪談綱要": "/s/interview",
  "AI迭代結果": "/s/ai-iteration",
  "活動規劃書": "/s/activity-plan",
};

// Journey map chapter labels — plain, no story framing. `minutes` is the
// suggested classroom time (per TA pacing reference).
export const GROUP_STORY: Record<string, { chapter: string; minutes: number | null }> = {
  "主題方向": { chapter: "第一關", minutes: 1 },
  "學習者評估內容規劃": { chapter: "第二關", minutes: 12 },
  "訪談綱要": { chapter: "第三關", minutes: 17 },
  "AI迭代結果": { chapter: "第四關", minutes: 20 },
  "活動規劃書": { chapter: "第五關", minutes: 20 },
};

export const SESSION_CHAPTERS_MINUTES = 70; // 第一～五關總計

// Ordered list of groups, used to compute "what's the next thing to do".
export const ORDERED_GROUPS = Array.from(new Set(FIELDS.map((f) => f.group)));

// Given the set of field keys a group has already finalized, returns where
// to send the student next: the dedicated page for a consolidated group,
// or the individual field-editor page. Returns null once everything is done.
export function getNextStep(doneKeys: Set<string>): { route: string; label: string } | null {
  for (const group of ORDERED_GROUPS) {
    const keysInGroup = FIELDS.filter((f) => f.group === group).map((f) => f.key);
    const remaining = keysInGroup.filter((k) => !doneKeys.has(k));
    if (remaining.length === 0) continue;
    const consolidated = CONSOLIDATED_GROUPS[group];
    if (consolidated) {
      return { route: consolidated, label: group };
    }
    const nextKey = remaining[0];
    return { route: `/s/field/${nextKey}`, label: getField(nextKey)?.label || nextKey };
  }
  return null;
}
