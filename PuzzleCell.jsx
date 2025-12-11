export default function PuzzleCell({ row, col, value, active, onKeyPress }) {
  return (
    <input
      className={"cell" + (active ? " active" : "")}
      maxLength={1}
      value={value ?? ""}
      onKeyDown={onKeyPress}
    />
  );
}
