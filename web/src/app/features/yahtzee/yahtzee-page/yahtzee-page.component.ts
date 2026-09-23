import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { YahtzeeRoomService } from '../../../core/services/yahtzee-room.service';
import { YahtzeeDiceComponent } from '../dice/dice.component';
import { YahtzeeScoreboardComponent } from '../scoreboard/scoreboard.component';
import { YahtzeeGameStatusComponent } from '../game-status/game-status.component';
import { YahtzeeLobbyComponent } from '../lobby/lobby.component';

@Component({
  selector: 'app-yahtzee-page',
  standalone: true,
  imports: [
    CommonModule,
    YahtzeeDiceComponent,
    YahtzeeScoreboardComponent,
    YahtzeeGameStatusComponent,
    YahtzeeLobbyComponent,
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
  protected playerName = '';

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    if (!this.roomId) {
      this.router.navigate(['/']);
      return;
    }

    const playerName = history.state?.playerName;

    if (!playerName) {
      this.router.navigate(['/join/yahtzee', this.roomId]);
      return;
    }

    this.playerName = playerName;
    sessionStorage.setItem('playerName', this.playerName);
    
    this.roomService.joinRoom(this.roomId, this.playerName);
  }

  ngOnDestroy(): void {
    this.roomService.leaveRoom();
  }

  onStartGame(): void {
    // O jogo é iniciado automaticamente quando o servidor muda a fase para 'playing'
  }

  goHome(): void {
    this.roomService.leaveRoom();
    this.router.navigate(['/']);
  }
}
