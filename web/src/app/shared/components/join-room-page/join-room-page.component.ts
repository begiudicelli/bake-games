import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-join-room-page',
  imports: [ReactiveFormsModule],
  templateUrl: './join-room-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinRoomPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly roomId = this.route.snapshot.paramMap.get('roomId') ?? '';

  readonly game = this.route.snapshot.paramMap.get('game') ?? '';

  readonly form = this.fb.nonNullable.group({
    playerName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
  });

  join(): void {
    if (this.form.invalid) return;

    const playerName = this.form.getRawValue().playerName.trim();

    this.router.navigate([`/${this.game}`, this.roomId], {
      state: {
        playerName,
      },
    });
  }
}
