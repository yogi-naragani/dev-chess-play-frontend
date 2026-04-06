export interface Course {
  id: string;
  name: string;
  description?: string;
  level: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { lessons: number };
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  meetingRoomId?: string;
  meetingUrl?: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  instructorId: string;
  courseId?: string;
  instructor?: { id: string; username: string; firstName: string; lastName: string };
  students?: LessonStudent[];
  course?: { id: string; name: string };
}

export interface LessonStudent {
  id: string;
  lessonId: string;
  studentId: string;
  attended: boolean;
  student?: { id: string; username: string; firstName: string; lastName: string };
}
