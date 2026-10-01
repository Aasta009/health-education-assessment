// Configuration for the AI-student iterative reasoning module. This is a
// separate module layered on top of the six chapters — it never changes
// FIELDS, GROUP_STORY, or the chapter-gating logic in lib/fields.ts.
export type AIChapterConfig = { key: string; title: string; groupNames: string[] };

export const AI_CHAPTERS_ROUND1: AIChapterConfig[] = [
  { key: "ch1", title: "第一關 下雨的草原", groupNames: ["主題方向"] },
  { key: "ch2", title: "第二關 不會走路的森林", groupNames: ["學習者評估內容規劃"] },
  { key: "ch3", title: "第三關 會忘記事情的河", groupNames: ["訪談綱要"] },
  { key: "ch4", title: "第四關 沒有門的房子", groupNames: ["學習者評估活動規劃書"] },
];

export const AI_CHAPTER_ROUND2: AIChapterConfig = {
  key: "integrated56",
  title: "第五、六關整合討論",
  groupNames: ["學習者評估結果", "確立主題與收尾"],
};

export const ALL_AI_CHAPTERS: AIChapterConfig[] = [...AI_CHAPTERS_ROUND1, AI_CHAPTER_ROUND2];

export function getAIChapter(key: string): AIChapterConfig | undefined {
  return ALL_AI_CHAPTERS.find((c) => c.key === key);
}
