import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'student-dashboard', loadComponent: () => import('./student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
  { path: 'join-lesson', loadComponent: () => import('./join-lesson/join-lesson.component').then(m => m.JoinLessonComponent) },
  { path: 'student-game', loadComponent: () => import('./student-game/student-game.component').then(m => m.StudentGameComponent) },
  { path: '**', redirectTo: '/login' }
];
