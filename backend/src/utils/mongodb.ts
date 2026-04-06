import mongoose from 'mongoose';

// ==================== SCHEMAS ====================

const moveSequenceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  opening: { type: String },
  pgn: { type: String },
  moves: [{
    move: String,
    annotation: String,
    fen: String,
    moveNumber: Number
  }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'master'] },
  tags: [String],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const puzzleSchema = new mongoose.Schema({
  fen: { type: String, required: true },
  solution: [{ type: String, required: true }], // Array of moves in UCI format
  category: { type: String, required: true },
  themes: [String], // e.g., ['fork', 'pin', 'mate_in_2']
  rating: { type: Number, default: 1200 },
  description: String,
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'system', 'move'], default: 'text' },
  createdAt: { type: Date, default: Date.now }
});

const chatRoomSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'group', 'game', 'lesson'], required: true },
  name: String,
  participants: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const gameMoveHistorySchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  moves: [{
    move: String,      // e.g., 'e2e4'
    san: String,       // e.g., 'e4'
    fen: String,       // position after move
    timestamp: Date,
    timeLeft: Number   // seconds remaining
  }],
  createdAt: { type: Date, default: Date.now }
});

const studentAnalyticsSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  puzzleRating: { type: Number, default: 1200 },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  lessonsAttended: { type: Number, default: 0 },
  openings: { type: Map, of: Number }, // { 'Sicilian Defense': 5, 'Italian Game': 3 }
  accuracy: [{
    date: Date,
    value: Number // percentage
  }],
  ratingHistory: [{
    date: Date,
    rating: Number
  }],
  puzzlesSolved: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

// ==================== MODELS ====================

export const MoveSequence = mongoose.model('MoveSequence', moveSequenceSchema);
export const Puzzle = mongoose.model('Puzzle', puzzleSchema);
export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export const GameMoveHistory = mongoose.model('GameMoveHistory', gameMoveHistorySchema);
export const StudentAnalytics = mongoose.model('StudentAnalytics', studentAnalyticsSchema);

// ==================== CONNECTION ====================

export async function connectMongoDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chess_academy';
  await mongoose.connect(uri);
}
