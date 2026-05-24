import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { Difficulty } from '@bake/shared/sudoku/sudoku-types';
import { GameCard } from '../../../core/models/game-card';

async function roomNameToId(name: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(name.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 8);
}

@Component({
  selector: 'app-game-entry',
  imports: [ReactiveFormsModule],
  templateUrl: './game-entry.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameEntryComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly game = input.required<GameCard>();
  readonly close = output<void>();
  readonly loading = signal(false);

  readonly form = this.fb.group({
    playerName: ['', [Validators.required, Validators.minLength(2)]],
    roomName: ['', [Validators.required, Validators.minLength(2)]],
    difficulty: ['medium'],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { playerName, roomName, difficulty } = this.form.getRawValue();
    const roomId = await roomNameToId(roomName!);

    this.router.navigate([this.game().route, roomId], {
      state: {
        playerName,
        roomName,
        difficulty: difficulty as Difficulty,
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
