import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TicTacToeRoomService } from '../../../core/services/tic-tac-toe-room.service';
import { GameWaitingRoomComponent } from '../../../shared/components/game-waiting-room/game-waiting-room.component';
import { RoomInfoComponent } from '../../../shared/components/room-info/room-info.component';
import { BoardComponent } from '../board/board.component';
import { GameStatusComponent } from '../game-status/game-status.component';

@Component({
  selector: 'app-tic-tac-toe-page',
  standalone: true,
  imports: [
    CommonModule,
    GameWaitingRoomComponent,
    BoardComponent,
    GameStatusComponent,
    RoomInfoComponent,
  ],
  templateUrl: './tic-tac-toe-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicTacToePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly gameService = inject(TicTacToeRoomService);

  roomId = '';
  private readonly _playerName = signal('');
  readonly playerName = this._playerName.asReadonly();

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;

    if (playerName) {
      this._playerName.set(playerName);
      sessionStorage.setItem('playerName', playerName);
    }
  }

  ngOnDestroy(): void {
    this.gameService.leaveRoom();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
