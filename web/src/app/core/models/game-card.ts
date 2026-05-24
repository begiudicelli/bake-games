export interface GameCard {
  id: string;
  title: string;
  description: string;
  players: string;
  route: string;
  hasDifficulty?: boolean;
}
