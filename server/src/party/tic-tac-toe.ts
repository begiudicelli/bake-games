import type * as Party from 'partykit/server';
import type {TicTacToe} from '@bake/shared';


const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: TicTacToe.Board): TicTacToe.Player | 'draw' | null {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as TicTacToe.Player;
    }
  }
  if (board.every((cell) => cell !== null)) return 'draw';
  return null;
}

function createInitialState(): TicTacToe.RoomState {
  return {
    board: Array(9).fill(null) as TicTacToe.Cell[],
    currentTurn: 'X',
    phase: 'waiting',
    players: {},
    winner: null,
  };
}

export default class TicTacToeServer implements Party.Server {
  private state: TicTacToe.RoomState;

  constructor(readonly room: Party.Room) {
    this.state = createInitialState();
  }

  private broadcast(message: TicTacToe.ServerMessage): void {
    this.room.broadcast(JSON.stringify(message));
  }

  private sendTo(conn: Party.Connection, message: TicTacToe.ServerMessage): void {
    conn.send(JSON.stringify(message));
  }

  private assignSymbol(): TicTacToe.Player | null {
    const taken = Object.values(this.state.players).map((p) => p.symbol);
    if (!taken.includes('X')) return 'X';
    if (!taken.includes('O')) return 'O';
    return null;
  }

  onConnect(conn: Party.Connection): void {
    const symbol = this.assignSymbol();

    if (!symbol) {
      this.sendTo(conn, { type: 'ERROR', message: 'Sala cheia.' });
      conn.close();
      return;
    }

    this.state.players[conn.id] = { symbol, name: 'Jogador' };
    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    console.log(`[tic-tac-toe] ${symbol} conectado (sala: ${this.room.id})`);
  }

  onClose(conn: Party.Connection): void {
    delete this.state.players[conn.id];
    this.state.phase = 'waiting';
    this.state.board = Array(9).fill(null);
    this.state.currentTurn = 'X';
    this.state.winner = null;
    this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    console.log(`[tic-tac-toe] jogador desconectado (sala: ${this.room.id})`);
  }

  onMessage(message: string, sender: Party.Connection): void {
    const parsed = JSON.parse(message) as TicTacToe.ClientMessage;
    const playerInfo = this.state.players[sender.id];

    if (!playerInfo) return;

    if (parsed.type === 'JOIN') {
      this.state.players[sender.id].name = parsed.playerName;
      const bothConnected = Object.keys(this.state.players).length === 2;
      const bothNamed = Object.values(this.state.players).every((p) => p.name !== 'Jogador');
      if (bothConnected && bothNamed) {
        this.state.phase = 'playing';
      }
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
      return;
    }

    if (parsed.type === 'MOVE') {
      if (this.state.phase !== 'playing') return;
      if (this.state.currentTurn !== playerInfo.symbol) {
        this.sendTo(sender, { type: 'ERROR', message: 'Não é sua vez.' });
        return;
      }
      if (this.state.board[parsed.index] !== null) {
        this.sendTo(sender, { type: 'ERROR', message: 'Célula já ocupada.' });
        return;
      }

      this.state.board[parsed.index] = playerInfo.symbol;
      const winner = checkWinner(this.state.board);

      if (winner) {
        this.state.winner = winner;
        this.state.phase = 'finished';
      } else {
        this.state.currentTurn = this.state.currentTurn === 'X' ? 'O' : 'X';
      }

      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    }

    if (parsed.type === 'RESTART') {
      if (this.state.phase !== 'finished') return;
      this.state.board = Array(9).fill(null);
      this.state.currentTurn = 'X';
      this.state.winner = null;
      this.state.phase = 'playing';
      this.broadcast({ type: 'STATE_UPDATE', state: this.state });
    }
  }
}
