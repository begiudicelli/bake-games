import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { GamePhase, Player, PlayerInfo } from '@bake/shared';

@Component({
  selector: 'app-game-status',
  templateUrl: './game-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameStatusComponent {
  readonly phase = input.required<GamePhase>();
  readonly winner = input.required<Player | 'draw' | null>();
  readonly currentTurn = input.required<Player>();
  readonly isMyTurn = input.required<boolean>();
  readonly playersInfo = input.required<PlayerInfo[]>();

  getPlayerName(symbol: Player | 'draw' | null): string {
    if (!symbol || symbol === 'draw') {
      return '';
    }
    return this.playersInfo().find((p) => p.symbol === symbol)?.name ?? symbol;
  }
}
