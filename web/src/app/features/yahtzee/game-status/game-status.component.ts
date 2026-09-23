import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { YahtzeeRoomService } from '../../../core/services/yahtzee-room.service';

@Component({
  selector: 'app-yahtzee-game-status',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  templateUrl: './game-status.component.html',
  styleUrl: './game-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YahtzeeGameStatusComponent {
  protected readonly roomService = inject(YahtzeeRoomService);

  restart(): void {
    this.roomService.restart();
  }
}
