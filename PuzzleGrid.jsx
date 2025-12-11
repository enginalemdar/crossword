import { useState } from "react";
import PuzzleCell from "./PuzzleCell";

export default function PuzzleGrid({ puzzle }) {
  const [grid, setGrid] = useState(puzzle.grid);
  const [focus, setFocus] = useState(null); // {row, col, direction}

  const handleKeyPress = (row, col, e) => {
    const key = e.key.toUpperCase();
    if (!key.match(/[A-ZÇĞİÖŞÜ]/)) return;

    const newGrid = [...grid];
    newGrid[row][col] = key;
    setGrid(newGrid);

    // otomatik ilerleme
    if (focus?.direction === "across")
      setFocus({ row, col: col + 1, direction: "across" });
    else
      setFocus({ row: row + 1, col, direction: "down" });
  };

  return (
    <div className="grid">
      {grid.map((rowArr, r) =>
        rowArr.map((cell, c) => (
          <PuzzleCell
            key={`${r}-${c}`}
            row={r}
            col={c}
            value={cell}
            active={focus?.row === r && focus?.col === c}
            onKeyPress={(e) => handleKeyPress(r, c, e)}
          />
        ))
      )}
    </div>
  );
}
