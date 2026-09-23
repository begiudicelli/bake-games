/**
 * Common game interfaces for Bake Games
 * Every game should implement these interfaces
 */

export type GamePhase = 'waiting' | 'playing' | 'finished';

/**
 * Base player state that all games should extend
 */
export interface BasePlayerState {
  name: string;
  finished: boolean;
}

/**
 * Base room state that all games should extend
 */
export interface BaseRoomState {
  phase: GamePhase;
  players: Record<string, any>;
  currentTurnId: string | null;
  winnerId: string | null;
  leaderId: string | null;
}

/**
 * Common client message types
 */
export interface BaseClientMessage {
  type: string;
}

/**
 * Common server message types
 */
export type BaseServerMessage =
  | { type: 'STATE_UPDATE'; state: any }
  | { type: 'ERROR'; message: string };

/**
 * Game metadata for creating new games
 */
export interface GameMetadata {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  route: string;
  party: string;
}
