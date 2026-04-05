import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@chessacademy.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@chessacademy.com',
      password: adminPassword,
      firstName: 'Academy',
      lastName: 'Admin',
      userType: 'ADMIN'
    }
  });
  console.log(`Admin created: ${admin.username}`);

  // Create instructor
  const instructorPassword = await bcrypt.hash('instructor123', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@chessacademy.com' },
    update: {},
    create: {
      username: 'instructor1',
      email: 'instructor@chessacademy.com',
      password: instructorPassword,
      firstName: 'John',
      lastName: 'Fischer',
      userType: 'INSTRUCTOR'
    }
  });
  console.log(`Instructor created: ${instructor.username}`);

  // Create students
  const studentPassword = await bcrypt.hash('student123', 12);
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@chessacademy.com' },
    update: {},
    create: {
      username: 'student1',
      email: 'student1@chessacademy.com',
      password: studentPassword,
      firstName: 'Alice',
      lastName: 'Knight',
      userType: 'STUDENT',
      rating: 1200
    }
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@chessacademy.com' },
    update: {},
    create: {
      username: 'student2',
      email: 'student2@chessacademy.com',
      password: studentPassword,
      firstName: 'Bob',
      lastName: 'Bishop',
      userType: 'STUDENT',
      rating: 1350
    }
  });

  console.log(`Students created: ${student1.username}, ${student2.username}`);

  // Assign students to instructor
  await prisma.instructorStudent.upsert({
    where: { instructorId_studentId: { instructorId: instructor.id, studentId: student1.id } },
    update: {},
    create: { instructorId: instructor.id, studentId: student1.id }
  });
  await prisma.instructorStudent.upsert({
    where: { instructorId_studentId: { instructorId: instructor.id, studentId: student2.id } },
    update: {},
    create: { instructorId: instructor.id, studentId: student2.id }
  });

  // Create a course
  const course = await prisma.course.upsert({
    where: { id: 'default-beginner-course' },
    update: {},
    create: {
      id: 'default-beginner-course',
      name: 'Chess Fundamentals',
      description: 'Learn the basics of chess including piece movement, tactics, and openings.',
      level: 'beginner'
    }
  });
  console.log(`Course created: ${course.name}`);

  // Create a sample lesson
  const lesson = await prisma.lesson.create({
    data: {
      title: 'Introduction to Chess Openings',
      description: 'Learn the most popular chess openings and their principles.',
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      duration: 60,
      instructorId: instructor.id,
      courseId: course.id,
      students: {
        create: [
          { studentId: student1.id },
          { studentId: student2.id }
        ]
      }
    }
  });
  console.log(`Lesson created: ${lesson.title}`);

  console.log('Seeding complete!');
  console.log('\nDefault credentials:');
  console.log('  Admin: admin@chessacademy.com / admin123');
  console.log('  Instructor: instructor@chessacademy.com / instructor123');
  console.log('  Student 1: student1@chessacademy.com / student123');
  console.log('  Student 2: student2@chessacademy.com / student123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
