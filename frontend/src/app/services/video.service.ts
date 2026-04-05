import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  url: string;
  thumbnailUrl?: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private readonly API_URL = 'http://localhost:3000/api/videos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private getJsonHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getVideos(): Observable<VideoListResponse> {
    return this.http.get<VideoListResponse>(this.API_URL, {
      headers: this.getJsonHeaders()
    });
  }

  getVideo(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.API_URL}/${id}`, {
      headers: this.getJsonHeaders()
    });
  }

  uploadVideo(file: File, metadata: { title: string; description: string; category: string; level: string }): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', metadata.title);
    formData.append('description', metadata.description);
    formData.append('category', metadata.category);
    formData.append('level', metadata.level);

    const token = localStorage.getItem('accessToken');
    const req = new HttpRequest('POST', this.API_URL, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      }),
      reportProgress: true
    });

    return this.http.request(req);
  }

  deleteVideo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, {
      headers: this.getJsonHeaders()
    });
  }

  updateVideo(id: string, data: Partial<Video>): Observable<Video> {
    return this.http.put<Video>(`${this.API_URL}/${id}`, data, {
      headers: this.getJsonHeaders()
    });
  }
}
