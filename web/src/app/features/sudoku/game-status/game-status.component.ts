import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { GamePhase } from '@bake/shared/src/sudoku/sudoku-types';

export interface PlayerDisplay {
  id: string;
  name: string;
  progress: number;
  finished: boolean;
  hasErrors: boolean;
  winner: boolean;
  isMe: boolean;
}

@Component({
  selector: 'app-sudoku-game-status',
  templateUrl: './game-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SudokuGameStatusComponent {
  readonly phase = input.required<GamePhase>();
  readonly players = input.required<PlayerDisplay[]>();
}
