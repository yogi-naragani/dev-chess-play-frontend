import { Server, Socket } from 'socket.io';

export function lessonHandler(io: Server, socket: Socket): void {
  // Instructor joins lesson room
  socket.on('instructorJoinLesson', (data: { lessonId: string }) => {
    socket.join(`lesson:${data.lessonId}`);
    io.to(`lesson:${data.lessonId}`).emit('instructorJoined', {
      instructorId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Student joins lesson room
  socket.on('studentJoinLesson', (data: { lessonId: string }) => {
    socket.join(`lesson:${data.lessonId}`);
    io.to(`lesson:${data.lessonId}`).emit('studentJoined', {
      studentId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Leave lesson
  socket.on('leaveLesson', (data: { lessonId: string }) => {
    socket.leave(`lesson:${data.lessonId}`);
    io.to(`lesson:${data.lessonId}`).emit('participantLeft', {
      userId: socket.data.userId,
      username: socket.data.username
    });
  });

  // Instructor makes a move on the teaching board
  socket.on('instructorMove', (data: {
    lessonId: string;
    move: string;
    san: string;
    fen: string;
  }) => {
    socket.to(`lesson:${data.lessonId}`).emit('instructorMoveMade', {
      move: data.move,
      san: data.san,
      fen: data.fen,
      instructorId: socket.data.userId
    });
  });

  // Instructor resets the board
  socket.on('resetLessonBoard', (data: { lessonId: string; fen?: string }) => {
    io.to(`lesson:${data.lessonId}`).emit('boardReset', {
      fen: data.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    });
  });

  // Instructor loads a move sequence
  socket.on('loadMoveSequence', (data: {
    lessonId: string;
    sequenceId: string;
    moves: Array<{ move: string; annotation: string; fen: string }>;
  }) => {
    io.to(`lesson:${data.lessonId}`).emit('moveSequenceLoaded', {
      sequenceId: data.sequenceId,
      moves: data.moves
    });
  });

  // Instructor navigates through move sequence
  socket.on('navigateSequence', (data: { lessonId: string; moveIndex: number; fen: string }) => {
    socket.to(`lesson:${data.lessonId}`).emit('sequenceNavigated', {
      moveIndex: data.moveIndex,
      fen: data.fen
    });
  });
}
