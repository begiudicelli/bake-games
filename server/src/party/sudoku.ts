import { generateSudoku } from '@bake/shared/src/sudoku/sudoku-generator';
import type { Sudoku } from '@bake/shared';
import type * as Party from 'partykit/server';

const CLUES_BY_DIFFICULTY: Record<Sudoku.Difficulty, number> = {
  easy: 46,
  medium: 36,
  hard: 26,
};

function createEmptyGrid(): number[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function countProgress(grid: number[][], puzzle: number[][]): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] === 0 && grid[r][c] !== 0) count++;
    }
  }
  return count;
}

function isSolutionValid(grid: number[][], puzzle: number[][], solution: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] !== 0) continue;
      if (grid[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

function isBoardComplete(grid: number[][], puzzle: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (puzzle[r][c] === 0 && grid[r][c] === 0) return false;
    }
  }
  return true;
}

function createInitialState(): Sudoku.RoomState {
  return {
    puzzle: createEmptyGrid(),
    difficulty: 'medium',
    phase: 'waiting',
    players: {},
    winnerId: null,
  };
}

export default class SudokuServer implements Party.Server {
  private state: Sudoku.RoomState;
  private solution: number[][] = [];
  private difficulty: Sudoku.Difficulty = 'medium';
  private generated = false;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: Sudoku.ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  private sendTo(conn: Party.Connection, message: Sudoku.ServerMessage): void {
    conn.send(JSON.stringify(message));
  }

  onConnect(conn: Party.Connection): void {
    const playerCount = Object.keys(this.state.players).length;

    if (playerCount >= 2) {
      this.sendTo(conn, { type: 'ERROR', message: 'Sala cheia.' });
      conn.close();
      return;
    }

    this.state.players[conn.id] = {
      name: 'Jogador',
      grid: createEmptyGrid(),
      progress: 0,
      finished: false,
      hasErrors: false,
      winner: false,
    };

    this.sendTo(conn, { type: 'STATE_UPDATE', state: this.state });
    console.log(`[sudoku] jogador conectado (sala: ${this.room.id})`);
  }

  onClose(conn: Party.Connection): void {
    delete this.state.players[conn.id];

    if (Object.keys(this.state.players).length === 0) {
      this.state = createInitialState();
      this.solution = [];
      this.generated = false;
    } else {
      this.state.phase = 'waiting';
    }

    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    console.log(`[sudoku] jogador desconectado (sala: ${this.room.id})`);
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as Sudoku.ClientMessage;
    const player = this.state.players[sender.id];

    if (!player) return;

    if (parsed.type === 'JOIN') {
      player.name = parsed.playerName;
      this.difficulty = parsed.difficulty;

      const allNamed = Object.values(this.state.players).every((p) => p.name !== 'Jogador');
      const bothConnected = Object.keys(this.state.players).length === 2;

      if (bothConnected && allNamed && !this.generated) {
        const clues = CLUES_BY_DIFFICULTY[this.difficulty];
        const { puzzle, solution } = generateSudoku(clues);
        this.solution = solution;
        this.state.puzzle = puzzle;
        this.state.difficulty = this.difficulty;
        this.state.phase = 'playing';
        this.generated = true;

        for (const p of Object.values(this.state.players)) {
          p.grid = createEmptyGrid();
          p.progress = 0;
          p.finished = false;
          p.hasErrors = false;
          p.winner = false;
        }
      }

      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'PLACE_NUMBER') {
      if (this.state.phase !== 'playing') return;
      if (player.finished) return;

      const { row, col, value } = parsed;
      if (this.state.puzzle[row][col] !== 0) return;
      if (value < 1 || value > 9) return;

      player.grid[row][col] = value;
      player.progress = countProgress(player.grid, this.state.puzzle);

      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'ERASE') {
      if (this.state.phase !== 'playing') return;
      if (player.finished) return;

      const { row, col } = parsed;
      if (this.state.puzzle[row][col] !== 0) return;

      player.grid[row][col] = 0;
      player.progress = countProgress(player.grid, this.state.puzzle);

      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'SUBMIT') {
      if (this.state.phase !== 'playing') return;
      if (player.finished) return;
      if (!isBoardComplete(player.grid, this.state.puzzle)) {
        this.sendTo(sender, {
          type: 'ERROR',
          message: 'Preencha todas as células antes de enviar.',
        });
        return;
      }

      const valid = isSolutionValid(player.grid, this.state.puzzle, this.solution);

      if (valid) {
        player.finished = true;
        player.winner = true;
        player.hasErrors = false;
        this.state.phase = 'finished';
        this.state.winnerId = sender.id;
      } else {
        player.finished = true;
        player.hasErrors = true;
      }

      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }
  }
}
