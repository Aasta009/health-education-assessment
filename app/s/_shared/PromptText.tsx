// Renders a field's guidance text, with an optional substring rendered in
// bold red (used for emphasis callouts like "不是正式衛教").
export default function PromptText({ prompt, highlightPhrase, style }: { prompt: string; highlightPhrase?: string; style?: React.CSSProperties }) {
  if (!highlightPhrase || !prompt.includes(highlightPhrase)) {
    return <p style={style}>{prompt}</p>;
  }
  const parts = prompt.split(highlightPhrase);
  return (
    <p style={style}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <b style={{ color: "#B33" }}>{highlightPhrase}</b>}
        </span>
      ))}
    </p>
  );
}
