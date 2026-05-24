import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicTacToeRoomService } from '../../../core/services/tic-tac-toe-room.service';
import { RoomInfoComponent } from '../../../shared/components/room-info/room-info.component';
import { BoardComponent } from '../board/board.component';
import { GameStatusComponent } from '../game-status/game-status.component';

@Component({
  selector: 'app-tic-tac-toe-page',
  imports: [BoardComponent, GameStatusComponent, RoomInfoComponent],
  templateUrl: './tic-tac-toe-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicTacToePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly gameService = inject(TicTacToeRoomService);

  roomId = '';

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;

    if (!playerName) {
      this.router.navigate(['/join/tic-tac-toe', this.roomId]);
      return;
    }

    this.gameService.joinRoom(this.roomId, playerName);
  }

  ngOnDestroy(): void {
    this.gameService.leaveRoom();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
