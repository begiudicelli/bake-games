import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface SelectedCell {
  row: number;
  col: number;
}

@Component({
  selector: 'app-sudoku-board',
  templateUrl: './sudoku-board.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeyDown($event)',
  },
})
export class SudokuBoardComponent {
  readonly puzzle = input.required<number[][]>();
  readonly grid = input.required<number[][]>();
  readonly disabled = input<boolean>(false);

  readonly placeNumber = output<{ row: number; col: number; value: number }>();
  readonly erase = output<{ row: number; col: number }>();

  readonly selected = signal<SelectedCell | null>(null);

  readonly rows = Array.from({ length: 9 }, (_, i) => i);
  readonly cols = Array.from({ length: 9 }, (_, i) => i);

  isClue(row: number, col: number): boolean {
    return this.puzzle()[row][col] !== 0;
  }

  cellValue(row: number, col: number): number {
    if (this.isClue(row, col)) return this.puzzle()[row][col];
    return this.grid()[row][col];
  }

  isSelected(row: number, col: number): boolean {
    const s = this.selected();
    return s?.row === row && s?.col === col;
  }

  isSameRowOrCol(row: number, col: number): boolean {
    const s = this.selected();
    if (!s) return false;
    return s.row === row || s.col === col;
  }

  isSameBox(row: number, col: number): boolean {
    const s = this.selected();
    if (!s) return false;
    return (
      Math.floor(s.row / 3) === Math.floor(row / 3) && Math.floor(s.col / 3) === Math.floor(col / 3)
    );
  }

  selectCell(row: number, col: number): void {
    if (this.disabled()) return;
    this.selected.set({ row, col });
  }

  onKeyDown(event: KeyboardEvent): void {
    const s = this.selected();
    if (!s || this.disabled()) return;

    if (event.key >= '1' && event.key <= '9') {
      if (this.isClue(s.row, s.col)) return;
      this.placeNumber.emit({ row: s.row, col: s.col, value: Number(event.key) });
      return;
    }

    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      if (this.isClue(s.row, s.col)) return;
      this.erase.emit({ row: s.row, col: s.col });
      return;
    }

    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };

    if (moves[event.key]) {
      event.preventDefault();
      const [dr, dc] = moves[event.key];
      this.selected.set({
        row: Math.max(0, Math.min(8, s.row + dr)),
        col: Math.max(0, Math.min(8, s.col + dc)),
      });
    }
  }

  boxBorderRight(col: number): boolean {
    return col === 2 || col === 5;
  }

  boxBorderBottom(row: number): boolean {
    return row === 2 || row === 5;
  }
}
