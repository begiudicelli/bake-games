import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { TicTacToe } from '@bake/shared';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameStatusComponent {
  readonly phase = input.required<TicTacToe.GamePhase>();
  readonly winner = input.required<TicTacToe.Player | 'draw' | null>();
  readonly currentTurn = input.required<TicTacToe.Player>();
  readonly isMyTurn = input.required<boolean>();
  readonly playersInfo = input.required<TicTacToe.PlayerInfo[]>();

  getPlayerName(symbol: TicTacToe.Player | 'draw' | null): string {
    if (!symbol || symbol === 'draw') {
      return '';
    }
    return this.playersInfo().find((p) => p.symbol === symbol)?.name ?? symbol;
  }
}
