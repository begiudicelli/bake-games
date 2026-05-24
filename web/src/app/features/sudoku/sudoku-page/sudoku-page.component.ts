import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { Sudoku } from '@bake/shared';
import { SudokuRoomService } from '../../../core/services/sudoku-room.service';
import { RoomInfoComponent } from '../../../shared/components/room-info/room-info.component';
import { SudokuGameStatusComponent } from '../game-status/game-status.component';
import { SudokuBoardComponent } from '../sudoku-board/sudoku-board.component';

@Component({
  selector: 'app-sudoku-page',
  imports: [SudokuBoardComponent, SudokuGameStatusComponent, RoomInfoComponent],
  templateUrl: './sudoku-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SudokuPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly gameService = inject(SudokuRoomService);

  readonly emptyGrid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0) as number[]);

  roomId = '';

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('roomId') ?? '';
    const playerName = history.state?.playerName;

    if (!playerName) {
      this.router.navigate(['/join/sudoku', this.roomId]);
      return;
    }

    const difficulty: Sudoku.Difficulty = history.state?.difficulty ?? 'medium';
    this.gameService.joinRoom(this.roomId, playerName, difficulty);
  }

  totalEmpty(): number {
    return this.gameService
      .state()
      .puzzle.flat()
      .filter((v) => v === 0).length;
  }

  ngOnDestroy(): void {
    this.gameService.leaveRoom();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
