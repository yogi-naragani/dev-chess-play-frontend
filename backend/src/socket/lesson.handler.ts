import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function isLessonInstructor(lessonId: string, userId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, instructorId: userId }
  });
  return !!lesson;
}

async function isLessonStudent(lessonId: string, userId: string): Promise<boolean> {
  const enrollment = await prisma.lessonStudent.findFirst({
    where: { lessonId, studentId: userId }
  });
  return !!enrollment;
}

async function isLessonParticipant(lessonId: string, userId: string): Promise<boolean> {
  return (await isLessonInstructor(lessonId, userId)) || (await isLessonStudent(lessonId, userId));
}

export function lessonHandler(io: Server, socket: Socket): void {
  // Instructor joins lesson room
  socket.on('instructorJoinLesson', async (data: { lessonId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isLessonInstructor(data.lessonId, socket.data.userId);
    if (!allowed) {
      socket.emit('lessonError', { message: 'You are not the instructor of this lesson' });
      return;
    }
    socket.join(`lesson:${data.lessonId}`);
    io.to(`lesson:${data.lessonId}`).emit('instructorJoined', {
      instructorId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Student joins lesson room
  socket.on('studentJoinLesson', async (data: { lessonId: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isLessonStudent(data.lessonId, socket.data.userId);
    if (!allowed) {
      socket.emit('lessonError', { message: 'You are not enrolled in this lesson' });
      return;
    }
    socket.join(`lesson:${data.lessonId}`);
    io.to(`lesson:${data.lessonId}`).emit('studentJoined', {
      studentId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Leave lesson
  socket.on('leaveLesson', async (data: { lessonId: string }) => {
    if (!socket.data.userId) return;
    socket.leave(`lesson:${data.lessonId}`);
    io.to(`lesson:${data.lessonId}`).emit('participantLeft', {
      userId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Instructor makes a move on the teaching board
  socket.on('instructorMove', async (data: {
    lessonId: string;
    move: string;
    san: string;
    fen: string;
  }) => {
    if (!socket.data.userId) return;
    const allowed = await isLessonInstructor(data.lessonId, socket.data.userId);
    if (!allowed) {
      socket.emit('lessonError', { message: 'Only the instructor can make teaching moves' });
      return;
    }
    socket.to(`lesson:${data.lessonId}`).emit('instructorMoveMade', {
      move: data.move,
      san: data.san,
      fen: data.fen,
      instructorId: socket.data.userId
    });
  });

  // Instructor resets the board
  socket.on('resetLessonBoard', async (data: { lessonId: string; fen?: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isLessonInstructor(data.lessonId, socket.data.userId);
    if (!allowed) return;

    io.to(`lesson:${data.lessonId}`).emit('boardReset', {
      fen: data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    });
  });

  // Instructor loads a move sequence
  socket.on('loadMoveSequence', async (data: {
    lessonId: string;
    sequenceId: string;
    moves: Array<{ move: string; annotation: string; fen: string }>;
  }) => {
    if (!socket.data.userId) return;
    const allowed = await isLessonInstructor(data.lessonId, socket.data.userId);
    if (!allowed) return;

    io.to(`lesson:${data.lessonId}`).emit('moveSequenceLoaded', {
      sequenceId: data.sequenceId,
      moves: data.moves
    });
  });

  // Instructor navigates through move sequence
  socket.on('navigateSequence', async (data: { lessonId: string; moveIndex: number; fen: string }) => {
    if (!socket.data.userId) return;
    const allowed = await isLessonInstructor(data.lessonId, socket.data.userId);
    if (!allowed) return;

    socket.to(`lesson:${data.lessonId}`).emit('sequenceNavigated', {
      moveIndex: data.moveIndex,
      fen: data.fen
    });
  });
}
