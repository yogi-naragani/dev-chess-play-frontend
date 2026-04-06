export interface Video {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  thumbnailUrl?: string;
  category: string;
  level: string;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
  uploadedById: string;
  uploadedBy?: { id: string; username: string; firstName: string; lastName: string };
  createdAt: string;
}
