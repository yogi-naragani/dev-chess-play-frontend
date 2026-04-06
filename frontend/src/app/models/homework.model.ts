export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: string;
  data: any;
  dueDate: string;
  assignedById: string;
  assignedBy?: { id: string; username: string; firstName: string; lastName: string };
  submissions?: Submission[];
  _count?: { submissions: number };
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  answer: any;
  grade?: number;
  feedback?: string;
  submittedAt: string;
  gradedAt?: string;
  student?: { id: string; username: string; firstName: string; lastName: string };
}
