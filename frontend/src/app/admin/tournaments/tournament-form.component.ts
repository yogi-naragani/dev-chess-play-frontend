import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './tournament-form.component.html',
  styleUrls: ['./tournament-form.component.css']
})
export class TournamentFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form!: FormGroup;
  isEditMode = false;
  tournamentId: string | null = null;
  loading = false;
  saving = false;

  formats = ['Swiss', 'Round Robin', 'Elimination', 'Double Elimination'];
  timeControls = ['Bullet (1+0)', 'Blitz (3+0)', 'Blitz (3+2)', 'Blitz (5+0)', 'Blitz (5+3)',
    'Rapid (10+0)', 'Rapid (10+5)', 'Rapid (15+10)', 'Classical (30+0)', 'Classical (60+30)'];

  ngOnInit(): void {
    this.tournamentId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.tournamentId;

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      format: ['', Validators.required],
      timeControl: ['', Validators.required],
      maxPlayers: [16, [Validators.required, Validators.min(2), Validators.max(256)]],
      startDate: ['', Validators.required]
    });

    if (this.isEditMode && this.tournamentId) {
      this.loadTournament(this.tournamentId);
    }
  }

  loadTournament(id: string): void {
    this.loading = true;
    this.adminService.getTournament(id).subscribe({
      next: (tournament) => {
        this.form.patchValue({
          name: tournament.name,
          format: tournament.format,
          timeControl: tournament.timeControl,
          maxPlayers: tournament.maxPlayers,
          startDate: new Date(tournament.startDate)
        });
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load tournament', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    const data = {
      ...this.form.value,
      startDate: this.form.value.startDate instanceof Date
        ? this.form.value.startDate.toISOString()
        : this.form.value.startDate
    };

    if (this.isEditMode && this.tournamentId) {
      this.adminService.updateTournament(this.tournamentId, data).subscribe({
        next: () => {
          this.snackBar.open('Tournament updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/tournaments']);
        },
        error: () => {
          this.snackBar.open('Failed to update tournament', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    } else {
      this.adminService.createTournament(data).subscribe({
        next: () => {
          this.snackBar.open('Tournament created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/admin/tournaments']);
        },
        error: () => {
          this.snackBar.open('Failed to create tournament', 'Close', { duration: 3000 });
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/tournaments']);
  }
}
