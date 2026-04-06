import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // ==================== ADMIN ROUTES ====================
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'instructors', loadComponent: () => import('./admin/instructors/instructor-list.component').then(m => m.InstructorListComponent) },
      { path: 'instructors/new', loadComponent: () => import('./admin/instructors/instructor-form.component').then(m => m.InstructorFormComponent) },
      { path: 'instructors/:id/edit', loadComponent: () => import('./admin/instructors/instructor-form.component').then(m => m.InstructorFormComponent) },
      { path: 'students', loadComponent: () => import('./admin/students/student-list.component').then(m => m.StudentListComponent) },
      { path: 'students/new', loadComponent: () => import('./admin/students/student-form.component').then(m => m.StudentFormComponent) },
      { path: 'students/:id/edit', loadComponent: () => import('./admin/students/student-form.component').then(m => m.StudentFormComponent) },
      { path: 'students/:id/progress', loadComponent: () => import('./admin/students/student-progress-detail.component').then(m => m.StudentProgressDetailComponent) },
      { path: 'courses', loadComponent: () => import('./admin/courses/course-list.component').then(m => m.CourseListComponent) },
      { path: 'courses/new', loadComponent: () => import('./admin/courses/course-form.component').then(m => m.CourseFormComponent) },
      { path: 'courses/:id/edit', loadComponent: () => import('./admin/courses/course-form.component').then(m => m.CourseFormComponent) },
      { path: 'moves', loadComponent: () => import('./admin/moves/moves-database.component').then(m => m.MovesDatabaseComponent) },
      { path: 'moves/new', loadComponent: () => import('./admin/moves/move-sequence-editor.component').then(m => m.MoveSequenceEditorComponent) },
      { path: 'puzzles', loadComponent: () => import('./admin/puzzles/puzzle-list.component').then(m => m.PuzzleListComponent) },
      { path: 'puzzles/new', loadComponent: () => import('./admin/puzzles/puzzle-form.component').then(m => m.PuzzleFormComponent) },
      { path: 'tournaments', loadComponent: () => import('./admin/tournaments/tournament-list.component').then(m => m.TournamentListComponent) },
      { path: 'tournaments/new', loadComponent: () => import('./admin/tournaments/tournament-form.component').then(m => m.TournamentFormComponent) },
      { path: 'analytics', loadComponent: () => import('./admin/analytics/academy-analytics.component').then(m => m.AcademyAnalyticsComponent) }
    ]
  },

  // ==================== INSTRUCTOR ROUTES ====================
  {
    path: 'instructor',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['instructor'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./instructor/dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent) },
      { path: 'lessons', loadComponent: () => import('./instructor/lessons/lesson-list.component').then(m => m.LessonListComponent) },
      { path: 'lessons/new', loadComponent: () => import('./instructor/lessons/lesson-form.component').then(m => m.LessonFormComponent) },
      { path: 'lessons/:id/live', loadComponent: () => import('./instructor/lessons/live-lesson.component').then(m => m.LiveLessonComponent) },
      { path: 'videos', loadComponent: () => import('./instructor/videos/video-management.component').then(m => m.VideoManagementComponent) },
      { path: 'videos/upload', loadComponent: () => import('./instructor/videos/video-upload.component').then(m => m.VideoUploadComponent) },
      { path: 'students', loadComponent: () => import('./instructor/students/instructor-student-list.component').then(m => m.InstructorStudentListComponent) },
      { path: 'students/:id/progress', loadComponent: () => import('./instructor/students/student-progress-view.component').then(m => m.StudentProgressViewComponent) },
      { path: 'homework', loadComponent: () => import('./instructor/homework/homework-list.component').then(m => m.HomeworkListComponent) },
      { path: 'homework/new', loadComponent: () => import('./instructor/homework/homework-form.component').then(m => m.HomeworkFormComponent) },
      { path: 'homework/:id/submissions', loadComponent: () => import('./instructor/homework/homework-submissions.component').then(m => m.HomeworkSubmissionsComponent) },
      { path: 'chat', loadComponent: () => import('./instructor/chat/instructor-chat.component').then(m => m.InstructorChatComponent) }
    ]
  },

  // ==================== STUDENT ROUTES ====================
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./student/dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'lessons', loadComponent: () => import('./student/lessons/student-lesson-list.component').then(m => m.StudentLessonListComponent) },
      { path: 'lessons/:id', loadComponent: () => import('./student/lessons/student-lesson-view.component').then(m => m.StudentLessonViewComponent) },
      { path: 'videos', loadComponent: () => import('./student/videos/video-library.component').then(m => m.VideoLibraryComponent) },
      { path: 'videos/:id', loadComponent: () => import('./student/videos/video-player.component').then(m => m.VideoPlayerComponent) },
      { path: 'moves', loadComponent: () => import('./student/moves/moves-library.component').then(m => m.MovesLibraryComponent) },
      { path: 'moves/:id', loadComponent: () => import('./student/moves/move-sequence-viewer.component').then(m => m.MoveSequenceViewerComponent) },
      { path: 'puzzles', loadComponent: () => import('./student/puzzles/puzzle-dashboard.component').then(m => m.PuzzleDashboardComponent) },
      { path: 'puzzles/:id', loadComponent: () => import('./student/puzzles/puzzle-solver.component').then(m => m.PuzzleSolverComponent) },
      { path: 'play', loadComponent: () => import('./student/play/game-lobby.component').then(m => m.GameLobbyComponent) },
      { path: 'play/computer', loadComponent: () => import('./student/play/computer-game/computer-game.component').then(m => m.ComputerGameComponent) },
      { path: 'play/game/:id', loadComponent: () => import('./student/play/peer-game/peer-game.component').then(m => m.PeerGameComponent) },
      { path: 'tournaments', loadComponent: () => import('./student/tournaments/tournament-list.component').then(m => m.TournamentListComponent) },
      { path: 'tournaments/:id', loadComponent: () => import('./student/tournaments/tournament-detail.component').then(m => m.TournamentDetailComponent) },
      { path: 'homework', loadComponent: () => import('./student/homework/homework-list.component').then(m => m.HomeworkListComponent) },
      { path: 'homework/:id', loadComponent: () => import('./student/homework/homework-detail.component').then(m => m.HomeworkDetailComponent) },
      { path: 'chat', loadComponent: () => import('./student/chat/student-chat.component').then(m => m.StudentChatComponent) },
      { path: 'progress', loadComponent: () => import('./student/progress/my-progress.component').then(m => m.MyProgressComponent) }
    ]
  },

  // Legacy redirects for old routes
  { path: 'dashboard', redirectTo: '/instructor/dashboard', pathMatch: 'full' },
  { path: 'student-dashboard', redirectTo: '/student/dashboard', pathMatch: 'full' },

  // Wildcard
  { path: '**', redirectTo: '/login' }
];
