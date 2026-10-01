import ChapterColumn from "../_components/ChapterColumn";

export default function AIDiscussion1() {
  const keys = ["ch1", "ch2", "ch3", "ch4"];
  return (
    <main className="container" style={{ paddingTop: 32, maxWidth: 1400 }}>
      <a href="/s">← 回到旅程地圖</a>
      <h2 className="story-title" style={{ fontSize: 21 }}>AI－學生迭代式推理歷程 I</h2>
      <p style={{ color: "var(--terracotta)", fontSize: 13, fontWeight: 700, margin: "4px 0" }}>建議 50 分鐘</p>
      <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
        把你們在 NotebookLM 上有意義的討論記錄下來：提問、AI 回覆、你們的判斷，可以來回好幾輪，直到滿意為止。
      </p>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 12 }}>
        {keys.map((k) => <ChapterColumn key={k} chapterKey={k} />)}
      </div>
    </main>
  );
}
