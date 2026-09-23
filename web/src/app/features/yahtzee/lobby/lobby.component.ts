import { ChangeDetectionStrategy, Component, inject, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Yahtzee } from '@bake/shared';
import { YahtzeeRoomService } from '../../../core/services/yahtzee-room.service';

@Component({
  selector: 'app-yahtzee-lobby',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YahtzeeLobbyComponent {
  protected readonly roomService = inject(YahtzeeRoomService);
  
  readonly roomId = input.required<string>();
  readonly playerName = input.required<string>();
  readonly startGame = output<void>();

  readonly copied = signal(false);

  protected readonly gameUrl = computed(() => {
    return `${window.location.origin}/join/yahtzee/${this.roomId()}`;
  });

  protected readonly isRoomLeader = computed(() => {
    const myId = this.roomService.myId();
    const players = this.roomService.playersInfo();
    return players.length > 0 && players[0].id === myId;
  });

  protected readonly canStartGame = computed(() => {
    return this.isRoomLeader() && this.roomService.playersInfo().length >= 2;
  });

  async copyToClipboard(): Promise<void> {
    await navigator.clipboard.writeText(this.gameUrl());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  onStartGame(): void {
    if (this.canStartGame()) {
      this.roomService.startGame();
    }
  }
}
