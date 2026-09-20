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
    prompt: "例如：國小三年級學童對失智症的基本概念／預防／與失智長者互動方式／社區失智友善環境……請寫下你想到的方向與理由。" },
  { key: "need", stage: 1, group: "學習者評估內容規劃",
    label: "學習需求　評估內容規劃",
    prompt: "針對你們選定的主題，學童需要具備哪些知識、態度或技能？打算怎麼評估？" },
  { key: "ready", stage: 1, group: "學習者評估內容規劃",
    label: "學習準備度　評估內容規劃",
    prompt: "學童的生理、情緒、經驗、知識準備度分別要怎麼評估？" },
  { key: "style", stage: 1, group: "學習者評估內容規劃",
    label: "學習風格　評估內容規劃",
    prompt: "打算怎麼了解學童偏好的學習方式（如圖像、遊戲、討論）？" },
  { key: "env", stage: 1, group: "學習者評估內容規劃",
    label: "教學環境　評估內容規劃",
    prompt: "打算怎麼評估國小現場的物理環境與心理環境？" },
  { key: "interview", stage: 1, group: "訪談綱要",
    label: "關鍵人物（導師／護理師）訪談綱要",
    prompt: "想請教導師或護理師哪些問題？（國小失智症衛教現況、不同年級衛教安排、教學方法與學生特性等）" },
  { key: "act_topic", stage: 1, group: "學習者評估活動規劃書",
    label: "活動主題",
    prompt: "這次 30 分鐘評估活動要怎麼命名？" },
  { key: "act_desc", stage: 1, group: "學習者評估活動規劃書",
    label: "活動規劃說明",
    prompt: "簡述這個活動的設計理念與想達成的目的。" },
  { key: "act_flow", stage: 1, group: "學習者評估活動規劃書",
    label: "活動流程（細流）",
    prompt: "請列出主要步驟、時間分配與活動設計（例如：開場／3分鐘／帶動唱＋自我介紹…）", multiline: true },
  { key: "act_roles", stage: 1, group: "學習者評估活動規劃書",
    label: "工作分配（主持人、紀錄、工具準備等）",
    prompt: "誰負責什麼？" },
  { key: "act_props", stage: 1, group: "學習者評估活動規劃書",
    label: "道具製作（若有）",
    prompt: "需要準備什麼道具或教具？" },

  // ---- Stage 2 (學習任務2，場域訪查之後填寫) ----
  { key: "result_need", stage: 2, group: "學習者評估結果",
    label: "學習需求　評估結果",
    prompt: "實際訪查後，學童的學習需求發現是什麼？" },
  { key: "result_ready_phys", stage: 2, group: "學習者評估結果",
    label: "學習準備度－生理準備度",
    prompt: "" },
  { key: "result_ready_health", stage: 2, group: "學習者評估結果",
    label: "學習準備度－健康狀況",
    prompt: "" },
  { key: "result_ready_emotion", stage: 2, group: "學習者評估結果",
    label: "學習準備度－情緒",
    prompt: "" },
  { key: "result_ready_knowledge", stage: 2, group: "學習者評估結果",
    label: "學習準備度－經驗及知識準備度",
    prompt: "" },
  { key: "result_style", stage: 2, group: "學習者評估結果",
    label: "學習風格　評估結果",
    prompt: "" },
  { key: "result_env", stage: 2, group: "學習者評估結果",
    label: "教學環境　評估結果",
    prompt: "" },
  { key: "result_teacher", stage: 2, group: "學習者評估結果",
    label: "教學者的評估",
    prompt: "組員身為未來的衛教者，自我評估的個人特質、教學風格、專業能力等。" },
  { key: "final_topic", stage: 2, group: "確立主題",
    label: "確立衛生教育主題（並說明動機）",
    prompt: "根據評估結果，最終確定的主題是什麼？為什麼？" },
  { key: "final_roles", stage: 2, group: "工作分配",
    label: "工作分配（最終版）",
    prompt: "" },
  { key: "final_refs", stage: 2, group: "參考資料",
    label: "參考資料",
    prompt: "這份報告引用了哪些資料來源？" },
];

export const STAGE1_KEYS = FIELDS.filter(f => f.stage === 1).map(f => f.key);
export const STAGE2_KEYS = FIELDS.filter(f => f.stage === 2).map(f => f.key);

export function getField(key: string): FieldConfig | undefined {
  return FIELDS.find(f => f.key === key);
}


// Story-chapter dressing for the student journey map. Purely presentational —
// does not affect the underlying field keys, data, or validation logic.
export const GROUP_STORY: Record<string, { chapter: string; title: string; blurb: string; icon: string }> = {
  "主題方向": {
    chapter: "第一關",
    title: "下雨的草原",
    blurb: "傘擋不住雨，卻替一隻蝸牛留了一小塊乾燥的地方。先別急著追求完美的主題，重要的是願意蹲下來看看。",
    icon: "snail",
  },
  "學習者評估內容規劃": {
    chapter: "第二關",
    title: "不會走路的森林",
    blurb: "森林在等一個願意停下來的人。把種子種進土裡，才會知道它需要什麼——這裡要規劃的，就是怎麼澆灌你們的評估內容。",
    icon: "seed",
  },
  "訪談綱要": {
    chapter: "第三關",
    title: "會忘記事情的河",
    blurb: "渡河要付出一點東西。去問一位導師或護理師幾個問題，就是你們願意付出的那一份。",
    icon: "river",
  },
  "學習者評估活動規劃書": {
    chapter: "第四關",
    title: "沒有門的房子",
    blurb: "修不好的東西，就讓它做別的事。把想法整理成一個實際可以帶去現場的活動流程。",
    icon: "house",
  },
};
