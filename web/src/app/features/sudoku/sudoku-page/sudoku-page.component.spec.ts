import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SudokuPageComponent } from './sudoku-page.component';

describe('SudokuPageComponent', () => {
  let component: SudokuPageComponent;
  let fixture: ComponentFixture<SudokuPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SudokuPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SudokuPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
