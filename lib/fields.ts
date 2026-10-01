export type FieldConfig = {
  key: string;
  stage: 1 | 2;
  group: string; // section grouping for display
  label: string;
  prompt: string;
  multiline?: boolean;
};

export const FIELDS: FieldConfig[] = [
  // ---- Stage 1 (學習任務1) ----
  { key: "topic", stage: 1, group: "主題方向",
    label: "本組欲聚焦的「失智友善」主題方向",
    prompt: "課堂提供三個年級主題，請依你們這組負責的年級選一個方向，並寫下理由：\n・二年級｜老化與生命的認識\n・三年級｜認識失智症的症狀與預防失智症\n・四年級｜失智症患者的相處與友善環境營造",
    multiline: true },
  { key: "need", stage: 1, group: "學習者評估內容規劃",
    label: "學習需求　評估內容規劃",
    prompt: "學習需求＝了解學童「原有的」及「想要的」知識、態度、技能之間的落差。\n參考 Panno(1992) 的三步驟來規劃：\n①了解學童現有的學習需求\n②分析學童「自己認為」的需求和「實際」需求之間的落差\n③排出評估內容的優先順序\n可參考課堂範例問題，例如（三年級）：「學童對失智症基本症狀的認識程度如何？」「能否區分失智症與其他健康問題？」依你們的主題自訂類似問題。",
    multiline: true },
  { key: "ready", stage: 1, group: "學習者評估內容規劃",
    label: "學習準備度　評估內容規劃",
    prompt: "學習準備度包含四個面向，請分別想好怎麼評估：\n・生理準備度：對照學童該年齡層的發展特徵（如學齡期6-11歲開始有因果推理能力；學齡前期較自我中心、怕痛）\n・情緒準備度：焦慮程度、支持系統、學習動機\n・經驗準備度：是否有相關主題的學習經驗、過去與長輩/失智症患者相處的經驗\n・知識準備度：先備知識、技能、態度、認知策略",
    multiline: true },
  { key: "style", stage: 1, group: "學習者評估內容規劃",
    label: "學習風格　評估內容規劃",
    prompt: "學習風格＝個人處理訊息的方式、學習過程中的偏好（Dunn & Dunn）。\n打算怎麼了解這群學童偏好的學習方式？（例如：圖像／故事、遊戲操作、小組討論、角色扮演等）不同風格會影響你們之後活動規劃書要用的教學方法。",
    multiline: true },
  { key: "env", stage: 1, group: "學習者評估內容規劃",
    label: "教學環境　評估內容規劃",
    prompt: "打算怎麼評估國小現場的教學環境？可分兩類：\n・物理環境：明亮度、聲音／噪音、空調溫度、座位與桌椅排列、空間大小、設備（投影機、電腦、海報等）、地點便利性\n・心理環境：班級氣氛、師生互動、同儕合作氣氛",
    multiline: true },
  { key: "interview", stage: 1, group: "訪談綱要",
    label: "關鍵人物（導師／護理師）訪談綱要",
    prompt: "想請教導師或護理師哪些問題？建議涵蓋：\n・國小目前失智症衛教現況（是否曾帶入相關議題、用什麼方式）\n・不同年級的衛教安排與可配合的時間\n・這群學童的教學方法建議與學生特性（如專注力、理解力、特殊需求）",
    multiline: true },
  { key: "act_topic", stage: 1, group: "學習者評估活動規劃書",
    label: "活動主題",
    prompt: "這次 30 分鐘「學習者評估活動」要怎麼命名？活動目的是蒐集資料做評估，不是正式衛教，取名時可以反映這一點。" },
  { key: "act_desc", stage: 1, group: "學習者評估活動規劃書",
    label: "活動規劃說明",
    prompt: "簡述這個活動的設計理念：為什麼這樣設計？想從中蒐集到學習需求、準備度、學習風格、教學環境哪些資訊？跟你們選定的主題方向有什麼關聯？",
    multiline: true },
  { key: "act_flow", stage: 1, group: "學習者評估活動規劃書",
    label: "活動流程（細流）",
    prompt: "請列出主要步驟與時間分配，30分鐘內需含「暖身」「評估活動主體」「收尾」。參考範例節奏：\n0-3分鐘｜暖身、自我介紹\n3-8分鐘｜引起動機（故事／提問）\n8-18分鐘｜評估活動主體（問答／遊戲／小組討論）\n18-25分鐘｜統整與觀察紀錄\n25-30分鐘｜收尾與致謝\n請依你們的活動內容調整各段落時間與具體做法。", multiline: true },
  { key: "act_roles", stage: 1, group: "學習者評估活動規劃書",
    label: "工作分配（主持人、紀錄、工具準備等）",
    prompt: "誰負責什麼？建議至少分配：主持人（帶流程）、計時員、紀錄員（記錄學童反應）、道具／教具準備。" },
  { key: "act_props", stage: 1, group: "學習者評估活動規劃書",
    label: "道具製作（若有）",
    prompt: "需要準備什麼道具或教具？例如故事卡、圖片、問卷、小遊戲教具等，依活動流程所需列出。" },

  // ---- Stage 2 (學習任務2，場域訪查之後填寫) ----
  { key: "result_need", stage: 2, group: "學習者評估結果",
    label: "學習需求　評估結果",
    prompt: "實際到國小訪查後，對照你們當初規劃的評估內容，學童的學習需求發現是什麼？他們現有的知識、態度、技能跟你們預期的落差在哪裡？" ,
    multiline: true },
  { key: "result_ready_phys", stage: 2, group: "學習者評估結果",
    label: "學習準備度－生理準備度",
    prompt: "對照該年齡層的發展特徵（例如：學齡期學童開始有因果推理能力、學齡前期較自我中心且怕痛），這群學童實際表現出來的生理／認知發展特徵是什麼？",
    multiline: true },
  { key: "result_ready_health", stage: 2, group: "學習者評估結果",
    label: "學習準備度－健康狀況",
    prompt: "有沒有觀察到影響學習的生理因素（視力、聽力、感官障礙等）或心理因素（情緒困擾、過度焦慮、注意力不集中）？這些是否影響了評估活動的進行？",
    multiline: true },
  { key: "result_ready_emotion", stage: 2, group: "學習者評估結果",
    label: "學習準備度－情緒",
    prompt: "學童在活動中的焦慮程度如何？他們的支持系統（家人、老師、同儕）與學習動機表現如何？",
    multiline: true },
  { key: "result_ready_knowledge", stage: 2, group: "學習者評估結果",
    label: "學習準備度－經驗及知識準備度",
    prompt: "學童過去是否有相關主題的學習經驗，或與長輩／失智症患者相處的經驗？他們目前的先備知識、技能與態度大概到什麼程度？",
    multiline: true },
  { key: "result_style", stage: 2, group: "學習者評估結果",
    label: "學習風格　評估結果",
    prompt: "實際觀察下來，這群學童偏好的學習方式是什麼（圖像、遊戲、討論、動手操作等）？這個發現會如何影響你們後續正式衛教的教學設計？",
    multiline: true },
  { key: "result_env", stage: 2, group: "學習者評估結果",
    label: "教學環境　評估結果",
    prompt: "實際到現場看到的物理環境（明亮度、空間、設備、座位等）與心理環境（班級氣氛、師生互動）是什麼樣子？跟你們原本規劃評估的項目對照起來如何？",
    multiline: true },
  { key: "result_teacher", stage: 2, group: "學習者評估結果",
    label: "教學者的評估",
    prompt: "組員身為未來的衛教者，對照課堂教的面向自我評估：\n・個人特質（對事情的看法、價值觀，是否展現高效能老師的特質，如同時維持師生架構又保持友善、允許學生參與決策）\n・教學風格是否適合這群學童\n・自己的專長／經驗是否足以支撐這個主題\n・生理狀況、多元文化教學涵養",
    multiline: true },
  { key: "final_topic", stage: 2, group: "確立主題與收尾",
    label: "確立衛生教育主題（並說明動機）",
    prompt: "根據以上評估結果，最終確定要執行的衛生教育主題是什麼？為什麼選這個（跟學童的需求、準備度、學習風格、現場環境的對應關係）？",
    multiline: true },
  { key: "final_roles", stage: 2, group: "確立主題與收尾",
    label: "工作分配（最終版）",
    prompt: "正式衛教活動的工作分配最終版，誰負責什麼？" },
  { key: "final_refs", stage: 2, group: "確立主題與收尾",
    label: "參考資料",
    prompt: "這份報告引用了哪些資料來源？記得列出課堂提到的 WHO 全球失智症行動計畫、衛生福利部失智症防治照護政策綱領等官方資料（若有引用）。",
    multiline: true },
];

export const STAGE1_KEYS = FIELDS.filter(f => f.stage === 1).map(f => f.key);
export const STAGE2_KEYS = FIELDS.filter(f => f.stage === 2).map(f => f.key);
export const ALL_KEYS = FIELDS.map(f => f.key);

export function getField(key: string): FieldConfig | undefined {
  return FIELDS.find(f => f.key === key);
}

// Story-chapter dressing for the student journey map. Purely presentational —
// does not affect the underlying field keys, data, or validation logic.
// `minutes` is the suggested classroom time budget: 學習任務1 (第一~四關)
// totals 100 分鐘 for one class period; 學習任務2 (第五~六關) totals 100
// 分鐘 for the other. These are guidance only, not an enforced timer.
export const GROUP_STORY: Record<string, { chapter: string; title: string; blurb: string; icon: string; minutes: number }> = {
  "主題方向": {
    chapter: "第一關",
    title: "下雨的草原",
    blurb: "傘擋不住雨，卻替一隻蝸牛留了一小塊乾燥的地方。先別急著追求完美的主題，重要的是願意蹲下來看看。",
    icon: "snail",
    minutes: 8,
  },
  "學習者評估內容規劃": {
    chapter: "第二關",
    title: "不會走路的森林",
    blurb: "森林在等一個願意停下來的人。把種子種進土裡，才會知道它需要什麼——這裡要規劃的，就是怎麼澆灌你們的評估內容。",
    icon: "seed",
    minutes: 12,
  },
  "訪談綱要": {
    chapter: "第三關",
    title: "會忘記事情的河",
    blurb: "渡河要付出一點東西。去問一位導師或護理師幾個問題，就是你們願意付出的那一份。",
    icon: "river",
    minutes: 10,
  },
  "學習者評估活動規劃書": {
    chapter: "第四關",
    title: "沒有門的房子",
    blurb: "修不好的東西，就讓它做別的事。把想法整理成一個實際可以帶去現場的活動流程。",
    icon: "house",
    minutes: 20,
  },
  "學習者評估結果": {
    chapter: "第五關",
    title: "迷路的人",
    blurb: "場域探查回來了，把一路上的發現寫成結果。就像撐傘的兩個人各淋濕了一半——把大家看到的拼在一起，才是完整的樣子。",
    icon: "girl",
    minutes: 28,
  },
  "確立主題與收尾": {
    chapter: "第六關",
    title: "世界盡頭的樹",
    blurb: "所有片段都到齊了：主題、工作分配、參考資料。讓它們在這裡長成一棵完整的樹。",
    icon: "tree",
    minutes: 12,
  },
};

// Personal reflection isn't part of the FIELDS/group_finals flow (it's never
// merged), so it isn't in GROUP_STORY above.
//
// Each 100-分鐘 class period is now split exactly in half: 50 分鐘 for the
// students to work through the chapters themselves (the numbers above sum
// to 50 per session), and a flat 50 分鐘 reserved for the AI-student
// iterative discussion step that follows (see lib/ai-chapters.ts).
export const REFLECTION_MINUTES = 10;

export const SESSION1_CHAPTERS_MINUTES = 50; // 第一～四關：學生自行作答
export const SESSION1_AI_MINUTES = 50;       // AI－學生迭代式推理歷程 I
export const SESSION1_TOTAL_MINUTES = 100;

export const SESSION2_CHAPTERS_MINUTES = 50; // 第五～六關＋個人反思：學生自行作答
export const SESSION2_AI_MINUTES = 50;       // AI－學生迭代式推理歷程 II
export const SESSION2_TOTAL_MINUTES = 100;

// Level gating: which numbered "chapter" each field group belongs to.
// A class only sees/can-edit fields up to its current unlocked level (see
// stage_gate table in lib/db.ts), controlled by the TA.
export const LEVEL_BY_GROUP: Record<string, number> = {
  "主題方向": 1,
  "學習者評估內容規劃": 2,
  "訪談綱要": 3,
  "學習者評估活動規劃書": 4,
  "學習者評估結果": 5,
  "確立主題與收尾": 6,
};
export const MAX_LEVEL = 6;

export function levelForField(key: string): number {
  const f = getField(key);
  if (!f) return 99;
  return LEVEL_BY_GROUP[f.group] ?? 99;
}
