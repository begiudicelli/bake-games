import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Yahtzee } from '@bake/shared';
import { YahtzeeRoomService } from '../../../core/services/yahtzee-room.service';

@Component({
  selector: 'app-yahtzee-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YahtzeeScoreboardComponent {
  protected readonly roomService = inject(YahtzeeRoomService);

  readonly scoreCategories: Array<{
    name: string;
    category: Yahtzee.ScoreCategory;
    section: 'upper' | 'lower';
  }> = [
    { name: 'Um', category: 'ones', section: 'upper' },
    { name: 'Dois', category: 'twos', section: 'upper' },
    { name: 'Três', category: 'threes', section: 'upper' },
    { name: 'Quatro', category: 'fours', section: 'upper' },
    { name: 'Cinco', category: 'fives', section: 'upper' },
    { name: 'Seis', category: 'sixes', section: 'upper' },
    { name: 'Três Iguais', category: 'threeOfAKind', section: 'lower' },
    { name: 'Quatro Iguais', category: 'fourOfAKind', section: 'lower' },
    { name: 'Full House', category: 'fullHouse', section: 'lower' },
    { name: 'Sequência Pequena', category: 'smallStraight', section: 'lower' },
    { name: 'Sequência Grande', category: 'largeStraight', section: 'lower' },
    { name: 'Yahtzee', category: 'yahtzee', section: 'lower' },
    { name: 'Chance', category: 'chance', section: 'lower' },
  ];

  selectCategory(category: Yahtzee.ScoreCategory): void {
    this.roomService.selectCategory(category);
  }

  getScore(category: Yahtzee.ScoreCategory): number | null {
    const score = this.roomService.myState()?.scores[category];
    return score !== undefined ? score : null;
  }

  isCategoryFilled(category: Yahtzee.ScoreCategory): boolean {
    return category in (this.roomService.myState()?.scores ?? {});
  }
}
