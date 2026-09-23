export type GamePhase = 'waiting' | 'playing' | 'finished';

export type ScoreCategory =
  | 'ones'
  | 'twos'
  | 'threes'
  | 'fours'
  | 'fives'
  | 'sixes'
  | 'threeOfAKind'
  | 'fourOfAKind'
  | 'fullHouse'
  | 'smallStraight'
  | 'largeStraight'
  | 'yahtzee'
  | 'chance';

export interface Dice {
  value: number;
  kept: boolean;
}

export interface PlayerState {
  name: string;
  dice: Dice[];
  rollsLeft: number;
  scores: Partial<Record<ScoreCategory, number>>;
  upperSectionTotal: number;
  bonus: number;
  totalScore: number;
  finished: boolean;
}

export interface RoomState {
  phase: GamePhase;
  players: Record<string, PlayerState>;
  currentTurnId: string | null;
  winnerId: string | null;
  leaderId: string | null;
}

export type ClientMessage =
  | { type: 'JOIN'; playerName: string }
  | { type: 'START' }
  | { type: 'ROLL_DICE' }
  | { type: 'TOGGLE_KEEP'; index: number }
  | { type: 'SELECT_CATEGORY'; category: ScoreCategory }
  | { type: 'RESTART' };

export type ServerMessage =
  | { type: 'STATE_UPDATE'; state: RoomState }
  | { type: 'ERROR'; message: string };
