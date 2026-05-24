export function generateSudoku(clues: number): {
  puzzle: number[][];
  solution: number[][];
} {
  const board = createEmptyBoard();
  fillBoard(board);
  const solution = board.map((row) => [...row]);
  removeClues(board, clues);
  return { puzzle: board, solution };
}

function createEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function fillBoard(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (const num of nums) {
        if (!isValid(board, row, col, num)) continue;
        board[row][col] = num;
        if (fillBoard(board)) return true;
        board[row][col] = 0;
      }
      return false;
    }
  }
  return true;
}

function removeClues(board: number[][], clues: number): void {
  const cells = shuffle(Array.from({ length: 81 }, (_, i) => i));
  const toRemove = 81 - clues;
  for (let i = 0; i < toRemove; i++) {
    const row = Math.floor(cells[i] / 9);
    const col = cells[i] % 9;
    board[row][col] = 0;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
