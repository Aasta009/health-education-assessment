import ChapterColumn from "../_components/ChapterColumn";

export default function AIDiscussion2() {
  return (
    <main className="container" style={{ paddingTop: 32 }}>
      <a href="/s">← 回到旅程地圖</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>AI－學生迭代式推理歷程 II</h2>
      <p style={{ color: "var(--terracotta)", fontSize: 13, fontWeight: 700, margin: "4px 0" }}>建議 50 分鐘</p>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        這次把第五、六關的定稿整合起來一起討論，形成最終報告要採用的內容。
      </p>
      <ChapterColumn chapterKey="integrated56" compact />
    </main>
  );
}
