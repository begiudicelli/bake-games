import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { YahtzeeRoomService } from '../../../core/services/yahtzee-room.service';
import { GameWaitingRoomComponent } from '../../../shared/components/game-waiting-room/game-waiting-room.component';
import { YahtzeeDiceComponent } from '../dice/dice.component';
import { YahtzeeScoreboardComponent } from '../scoreboard/scoreboard.component';
import { YahtzeeGameStatusComponent } from '../game-status/game-status.component';

@Component({
  selector: 'app-yahtzee-page',
  standalone: true,
  imports: [
    CommonModule,
    GameWaitingRoomComponent,
    YahtzeeDiceComponent,
    YahtzeeScoreboardComponent,
    YahtzeeGameStatusComponent,
  ],
  templateUrl: './yahtzee-page.component.html',
  styleUrl: './yahtzee-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YahtzeePageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly roomService = inject(YahtzeeRoomService);

  protected roomId = '';
  private readonly _playerName = signal('');
  readonly playerName = this._playerName.asReadonly();

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    if (!this.roomId) {
      this.router.navigate(['/']);
      return;
    }

    const playerName = history.state?.playerName;
    if (playerName) {
      this._playerName.set(playerName);
      sessionStorage.setItem('playerName', playerName);
    }
  }

  ngOnDestroy(): void {
    this.roomService.leaveRoom();
  }

  goHome(): void {
    this.roomService.leaveRoom();
    this.router.navigate(['/']);
  }
}
