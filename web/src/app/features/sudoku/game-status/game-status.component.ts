import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Sudoku } from '@bake/shared';

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
  readonly phase = input.required<Sudoku.GamePhase>();
  readonly players = input.required<PlayerDisplay[]>();
}
