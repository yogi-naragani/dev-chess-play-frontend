import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { ChatService, ChatContact, ChatMessage } from '../../services/chat.service';

@Component({
  selector: 'app-instructor-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './instructor-chat.component.html',
  styleUrl: './instructor-chat.component.css'
})
export class InstructorChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  contacts: ChatContact[] = [];
  selectedContact: ChatContact | null = null;
  messages: ChatMessage[] = [];
  messageText = '';
  loadingContacts = true;
  loadingMessages = false;
  currentUserId = '';

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Get current user ID from token (simplified)
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.currentUserId = payload.sub || payload.userId || '';
      }
    } catch {}

    this.chatService.connect();
    this.loadContacts();

    const msgSub = this.chatService.newMessage$.subscribe((msg) => {
      if (this.selectedContact &&
         (msg.senderId === this.selectedContact.id || msg.receiverId === this.selectedContact.id)) {
        this.messages.push(msg);
        this.scrollToBottom();
      }
      this.updateContactLastMessage(msg);
    });
    this.subscriptions.push(msgSub);

    const statusSub = this.chatService.onlineStatus$.subscribe((data) => {
      const contact = this.contacts.find(c => c.id === data.userId);
      if (contact) {
        contact.status = data.status;
      }
    });
    this.subscriptions.push(statusSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadContacts(): void {
    this.loadingContacts = true;
    this.chatService.getContacts().subscribe({
      next: (contacts) => {
        this.contacts = contacts;
        this.loadingContacts = false;
      },
      error: () => {
        this.contacts = [];
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
        this.messages = res.data;
        this.loadingMessages = false;
        this.scrollToBottom();
      },
      error: () => {
        this.messages = [];
        this.loadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedContact) return;

    this.chatService.sendMessage(this.selectedContact.id, this.messageText.trim()).subscribe({
      next: (msg) => {
        this.messages.push(msg);
        this.messageText = '';
        this.scrollToBottom();
      },
      error: () => {}
    });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getInitials(contact: ChatContact): string {
    return (contact.firstName?.[0] || '') + (contact.lastName?.[0] || '');
  }

  getDisplayName(contact: ChatContact): string {
    return `${contact.firstName} ${contact.lastName}`.trim() || contact.username;
  }

  isOwnMessage(msg: ChatMessage): boolean {
    return msg.senderId === this.currentUserId;
  }

  private updateContactLastMessage(msg: ChatMessage): void {
    const contactId = msg.senderId === this.currentUserId ? msg.receiverId : msg.senderId;
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.lastMessage = msg.content;
      contact.lastMessageAt = msg.createdAt;
      if (msg.senderId !== this.currentUserId && this.selectedContact?.id !== contactId) {
        contact.unreadCount++;
      }
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesEnd) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }
}
