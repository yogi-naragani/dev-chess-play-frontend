import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string;
  type: 'lesson' | 'homework' | 'tournament' | 'game' | 'challenge' | 'system';
  title: string;
  message: string;
  read: boolean;
  data?: any;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private apiUrl = environment.apiUrl;
  private socketUrl = environment.socketUrl;
  private socket: Socket | null = null;

  private notificationSubject = new Subject<Notification>();
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notification$ = this.notificationSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  connect(): void {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('accessToken');
    this.socket = io(`${this.socketUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('notification', (notification: Notification) => {
      this.notificationSubject.next(notification);
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    });

    this.socket.on('connect', () => {
      this.fetchUnreadCount();
    });
  }

  getNotifications(page: number = 1, limit: number = 20): Observable<{ data: Notification[]; total: number }> {
    return this.http.get<{ data: Notification[]; total: number }>(
      `${this.apiUrl}/notifications?page=${page}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/notifications/${id}/read`,
      {},
      { headers: this.getHeaders() }
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/notifications/read-all`,
      {},
      { headers: this.getHeaders() }
    );
  }

  private fetchUnreadCount(): void {
    this.http.get<{ count: number }>(
      `${this.apiUrl}/notifications/unread-count`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => this.unreadCountSubject.next(res.count),
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
