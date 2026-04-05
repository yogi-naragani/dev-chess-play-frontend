export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'system' | 'move';
  createdAt: string;
}

export interface ChatRoom {
  _id: string;
  type: 'direct' | 'group' | 'game' | 'lesson';
  name?: string;
  participants: string[];
  createdAt: string;
}
