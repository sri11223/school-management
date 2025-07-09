import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DatabaseManager } from '../database/DatabaseManager';
import { ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export interface FileUpload {
  id?: number;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadType: string;
  relatedTable?: string;
  relatedId?: number;
  uploadedBy: number;
  createdAt?: string;
}

export interface FileUploadOptions {
  uploadType: 'student_photo' | 'document' | 'bulk_import' | 'question_paper' | 'certificate' | 'general';
  relatedTable?: string;
  relatedId?: number;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
}

export class FileService {
  private dbManager: DatabaseManager;
  private uploadDir: string;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.initializeUploadDirectories();
  }

  private initializeUploadDirectories(): void {
    const directories = [
      this.uploadDir,
      path.join(this.uploadDir, 'students'),
      path.join(this.uploadDir, 'documents'),
      path.join(this.uploadDir, 'imports'),
      path.join(this.uploadDir, 'question-papers'),
      path.join(this.uploadDir, 'certificates'),
      path.join(this.uploadDir, 'temp')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created upload directory: ${dir}`);
      }
    });
  }

  public getMulterConfig(options: FileUploadOptions): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadPath = this.uploadDir;
        
        switch (options.uploadType) {
          case 'student_photo':
            uploadPath = path.join(this.uploadDir, 'students');
            break;
          case 'document':
          case 'certificate':
            uploadPath = path.join(this.uploadDir, 'documents');
            break;
          case 'bulk_import':
            uploadPath = path.join(this.uploadDir, 'imports');
            break;
          case 'question_paper':
            uploadPath = path.join(this.uploadDir, 'question-papers');
            break;
          default:
            uploadPath = path.join(this.uploadDir, 'temp');
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const filename = `${options.uploadType}-${uniqueSuffix}${extension}`;
        cb(null, filename);
      }
    });

    const fileFilter = (req: any, file: any, cb: multer.FileFilterCallback) => {
      // Check file type
      if (options.allowedTypes && options.allowedTypes.length > 0) {
        const isAllowed = options.allowedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.originalname.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.mimetype.toLowerCase().includes(type.toLowerCase());
        });

        if (!isAllowed) {
          return cb(new ValidationError(`File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`));
        }
      }

      cb(null, true);
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: options.maxSize || 10 * 1024 * 1024 // Default 10MB
      }
    });
  }

  public async saveFileRecord(file: any, options: FileUploadOptions, uploadedBy: number): Promise<FileUpload> {
    try {
      const fileRecord: Omit<FileUpload, 'id' | 'createdAt'> = {
        originalFilename: file.originalname,
        storedFilename: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadType: options.uploadType,
        relatedTable: options.relatedTable,
        relatedId: options.relatedId,
        uploadedBy
      };

      const query = `
        INSERT INTO file_uploads (
          original_filename, stored_filename, file_path, file_size, mime_type,
          upload_type, related_table, related_id, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await this.dbManager.runQuery(query, [
        fileRecord.originalFilename,
        fileRecord.storedFilename,
        fileRecord.filePath,
        fileRecord.fileSize,
        fileRecord.mimeType,
        fileRecord.uploadType,
        fileRecord.relatedTable || null,
        fileRecord.relatedId || null,
        fileRecord.uploadedBy
      ]);

      logger.info(`File uploaded: ${file.originalname} (ID: ${result.lastID})`);

      return {
        id: result.lastID,
        ...fileRecord,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // Delete the uploaded file if database save fails
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      logger.error('Failed to save file record:', error);
      throw error;
    }
  }

  public async getFileById(fileId: number): Promise<FileUpload | null> {
    try {
      const query = 'SELECT * FROM file_uploads WHERE id = ?';
      const file = await this.dbManager.getOne(query, [fileId]);
      return file || null;
    } catch (error) {
      logger.error('Failed to get file by ID:', error);
      throw error;
    }
  }

  public async getFilesByRelated(relatedTable: string, relatedId: number): Promise<FileUpload[]> {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE related_table = ? AND related_id = ?
        ORDER BY created_at DESC
      `;
      return await this.dbManager.getAll(query, [relatedTable, relatedId]);
    } catch (error) {
      logger.error('Failed to get files by related:', error);
      throw error;
    }
  }

  public async getFilesByType(uploadType: string, limit: number = 50, offset: number = 0): Promise<FileUpload[]> {
    try {
      const query = `
        SELECT * FROM file_uploads 
        WHERE upload_type = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      return await this.dbManager.getAll(query, [uploadType, limit, offset]);
    } catch (error) {
      logger.error('Failed to get files by type:', error);
      throw error;
    }
  }

  public async deleteFile(fileId: number, deletedBy: number): Promise<boolean> {
    try {
      // Get file info first
      const file = await this.getFileById(fileId);
      if (!file) {
        throw new ValidationError('File not found');
      }

      // Delete from database
      const query = 'DELETE FROM file_uploads WHERE id = ?';
      await this.dbManager.runQuery(query, [fileId]);

      // Delete physical file
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }

      logger.info(`File deleted: ${file.originalFilename} (ID: ${fileId}) by user ${deletedBy}`);
      return true;
    } catch (error) {
      logger.error('Failed to delete file:', error);
      throw error;
    }
  }

  public getFileUrl(file: FileUpload): string {
    // For now, return a local file path
    // In production, this might return a CDN URL or signed URL
    return `/api/files/${file.id}/download`;
  }

  public async processCSVImport(filePath: string): Promise<any[]> {
    try {
      // This is a simplified CSV parser - in production use a proper CSV library
      const csvContent = fs.readFileSync(filePath, 'utf8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }

      logger.info(`Processed CSV import: ${data.length} records from ${filePath}`);
      return data;
    } catch (error) {
      logger.error('Failed to process CSV import:', error);
      throw new ValidationError('Invalid CSV file format');
    }
  }

  public async getFileStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          upload_type,
          COUNT(*) as count,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size
        FROM file_uploads 
        GROUP BY upload_type
      `;
      
      const stats = await this.dbManager.getAll(query);
      
      const totalQuery = `
        SELECT 
          COUNT(*) as total_files,
          SUM(file_size) as total_size
        FROM file_uploads
      `;
      
      const totals = await this.dbManager.getOne(totalQuery);
      
      return {
        byType: stats,
        totals
      };
    } catch (error) {
      logger.error('Failed to get file stats:', error);
      throw error;
    }
  }

  public async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      // Get old temporary files
      const query = `
        SELECT * FROM file_uploads 
        WHERE upload_type = 'temp' AND created_at < ?
      `;
      
      const oldFiles = await this.dbManager.getAll(query, [cutoffDate.toISOString()]);
      let deletedCount = 0;

      for (const file of oldFiles) {
        try {
          await this.deleteFile(file.id, 1); // System cleanup
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete old file ${file.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${deletedCount} old files`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
      throw error;
    }
  }

  // Utility methods for common file operations
  public getImageUploadConfig(): multer.Multer {
    return this.getMulterConfig({
      uploadType: 'student_photo',
      allowedTypes: ['.jpg', '.jpeg', '.png', '.gif'],
      maxSize: 5 * 1024 * 1024 // 5MB
    });
  }

  public getDocumentUploadConfig(): multer.Multer {
    return this.getMulterConfig({
      uploadType: 'document',
      allowedTypes: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      maxSize: 10 * 1024 * 1024 // 10MB
    });
  }

  public getCSVUploadConfig(): multer.Multer {
    return this.getMulterConfig({
      uploadType: 'bulk_import',
      allowedTypes: ['.csv', '.xlsx', '.xls'],
      maxSize: 20 * 1024 * 1024 // 20MB
    });
  }
}
