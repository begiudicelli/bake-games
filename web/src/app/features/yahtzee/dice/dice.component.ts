import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YahtzeeRoomService } from '../../../core/services/yahtzee-room.service';

@Component({
  selector: 'app-yahtzee-dice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dice.component.html',
  styleUrl: './dice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YahtzeeDiceComponent {
  protected readonly roomService = inject(YahtzeeRoomService);

  rollDice(): void {
    this.roomService.rollDice();
  }

  toggleKeep(index: number): void {
    this.roomService.toggleKeep(index);
  }
}
