import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface ChatContact {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: string;
  status: 'online' | 'offline';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private apiUrl = 'http://localhost:3000/api';
  private socketUrl = 'http://localhost:3000';
  private socket: Socket | null = null;

  private messagesSubject = new Subject<ChatMessage>();
  private typingSubject = new Subject<{ userId: string; typing: boolean }>();
  private onlineStatusSubject = new Subject<{ userId: string; status: 'online' | 'offline' }>();

  public newMessage$ = this.messagesSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public onlineStatus$ = this.onlineStatusSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('accessToken');
    this.socket = io(`${this.socketUrl}/chat`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('newMessage', (message: ChatMessage) => {
      this.messagesSubject.next(message);
    });

    this.socket.on('userTyping', (data: { userId: string; typing: boolean }) => {
      this.typingSubject.next(data);
    });

    this.socket.on('userStatus', (data: { userId: string; status: 'online' | 'offline' }) => {
      this.onlineStatusSubject.next(data);
    });
  }

  getContacts(): Observable<ChatContact[]> {
    return this.http.get<ChatContact[]>(`${this.apiUrl}/chat/contacts`, { headers: this.getHeaders() });
  }

  getMessages(contactId: string, page: number = 1, limit: number = 50): Observable<{ data: ChatMessage[]; total: number }> {
    return this.http.get<{ data: ChatMessage[]; total: number }>(
      `${this.apiUrl}/chat/messages/${contactId}?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  sendMessage(receiverId: string, content: string): Observable<ChatMessage> {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { receiverId, content });
    }
    return this.http.post<ChatMessage>(
      `${this.apiUrl}/chat/messages`,
      { receiverId, content },
      { headers: this.getHeaders() }
    );
  }

  markAsRead(contactId: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/chat/messages/${contactId}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  sendTypingIndicator(receiverId: string, typing: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { receiverId, typing });
    }
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
