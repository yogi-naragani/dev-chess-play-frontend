import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { ChatService, ChatContact, ChatMessage } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatListModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatBadgeModule, MatDividerModule
  ],
  templateUrl: './student-chat.component.html',
  styleUrl: './student-chat.component.css'
})
export class StudentChatComponent implements OnInit, OnDestroy {
  contacts: ChatContact[] = [];
  selectedContact: ChatContact | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  loadingContacts = true;
  loadingMessages = false;
  currentUserId = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id || '';

    this.chatService.connect();
    this.loadContacts();

    const msgSub = this.chatService.newMessage$.subscribe(msg => {
      if (this.selectedContact &&
         (msg.senderId === this.selectedContact.id || msg.receiverId === this.selectedContact.id)) {
        this.messages.push(msg);
      }
      this.updateContactLastMessage(msg);
    });
    this.subscriptions.push(msgSub);

    const statusSub = this.chatService.onlineStatus$.subscribe(status => {
      const contact = this.contacts.find(c => c.id === status.userId);
      if (contact) {
        contact.status = status.status;
      }
    });
    this.subscriptions.push(statusSub);
  }

  loadContacts(): void {
    this.loadingContacts = true;
    this.chatService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.loadingContacts = false;
      },
      error: () => {
        this.loadingContacts = false;
      }
    });
  }

  selectContact(contact: ChatContact): void {
    this.selectedContact = contact;
    this.loadMessages(contact.id);
    if (contact.unreadCount > 0) {
      this.chatService.markAsRead(contact.id).subscribe();
      contact.unreadCount = 0;
    }
  }

  loadMessages(contactId: string): void {
    this.loadingMessages = true;
    this.chatService.getMessages(contactId).subscribe({
      next: (res) => {
        this.messages = res.data || [];
        this.loadingMessages = false;
      },
      error: () => {
        this.loadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedContact) return;
    this.chatService.sendMessage(this.selectedContact.id, this.newMessage).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.newMessage = '';
      },
      error: () => {}
    });
  }

  onTyping(): void {
    if (this.selectedContact) {
      this.chatService.sendTypingIndicator(this.selectedContact.id, true);
    }
  }

  private updateContactLastMessage(msg: ChatMessage): void {
    const contactId = msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId;
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.lastMessage = msg.content;
      contact.lastMessageAt = msg.createdAt;
      if (msg.senderId !== this.currentUserId &&
          (!this.selectedContact || this.selectedContact.id !== contactId)) {
        contact.unreadCount++;
      }
    }
  }

  isOwnMessage(msg: ChatMessage): boolean {
    return msg.senderId === this.currentUserId;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }
}
