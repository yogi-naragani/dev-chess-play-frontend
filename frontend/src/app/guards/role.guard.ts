import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as string[];

  const user = authService.getCurrentUser();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (requiredRoles && requiredRoles.includes(user.userType)) {
    return true;
  }

  // Redirect to appropriate dashboard
  switch (user.userType) {
    case 'admin': router.navigate(['/admin/dashboard']); break;
    case 'instructor': router.navigate(['/instructor/dashboard']); break;
    case 'student': router.navigate(['/student/dashboard']); break;
    default: router.navigate(['/login']);
  }

  return false;
};
