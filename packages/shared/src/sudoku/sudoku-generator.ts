// Sudoku Generator - Comprovado e Funcional
// Based on backtracking algorithm

export function generateSudoku(clues: number): {
  puzzle: number[][];
  solution: number[][];
} {
  const board = createEmptyBoard();
  
  // Fill the board with a valid solution
  fillBoardWithSolution(board);
  
  // Save the complete solution
  const solution = board.map((row) => [...row]);
  
  // Create puzzle by removing cells
  const puzzle = board.map((row) => [...row]);
  removeCellsRandomly(puzzle, 81 - clues);
  
  return { puzzle, solution };
}

function createEmptyBoard(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValidPlacement(board: number[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }
  
  // Check column
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }
  
  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let i = boxRow; i < boxRow + 3; i++) {
    for (let j = boxCol; j < boxCol + 3; j++) {
      if (board[i][j] === num) return false;
    }
  }
  
  return true;
}

function fillBoardWithSolution(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        // Try numbers 1-9 in random order
        const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            
            if (fillBoardWithSolution(board)) {
              return true;
            }
            
            board[row][col] = 0;
          }
        }
        
        return false;
      }
    }
  }
  
  return true;
}

function removeCellsRandomly(board: number[][], cellsToRemove: number): void {
  let removed = 0;
  const indices = shuffleArray(Array.from({ length: 81 }, (_, i) => i));
  
  for (const idx of indices) {
    if (removed >= cellsToRemove) break;
    
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      removed++;
    }
  }
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}
