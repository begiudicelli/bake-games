import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { TicTacToe } from '@bake/shared';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  readonly board = input.required<TicTacToe.Board>();
  readonly phase = input.required<TicTacToe.GamePhase>();
  readonly isMyTurn = input.required<boolean>();
  readonly cellClick = output<number>();
}
