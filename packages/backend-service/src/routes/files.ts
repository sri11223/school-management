import express, { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { FileService } from '../services/FileService';
import { authenticateToken, AuthenticatedRequest, requirePermission } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();
const fileService = new FileService();

// POST /api/files/upload/image - Upload image (student photos, etc.)
router.post('/upload/image', 
  authenticateToken, 
  requirePermission('upload_files'),
  asyncHandler(async (req, res) => {
    const upload = fileService.getImageUploadConfig();
    
    upload.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      const options = {
        uploadType: 'student_photo' as const,
        relatedTable: req.body.relatedTable,
        relatedId: req.body.relatedId ? parseInt(req.body.relatedId) : undefined
      };

      const fileRecord = await fileService.saveFileRecord(req.file, options, authenticatedReq.user!.id);
      
      res.json({
        message: 'Image uploaded successfully',
        file: fileRecord,
        url: fileService.getFileUrl(fileRecord)
      });
    });
  })
);

// POST /api/files/upload/document - Upload documents
router.post('/upload/document', 
  authenticateToken, 
  requirePermission('upload_files'),
  asyncHandler(async (req, res) => {
    const upload = fileService.getDocumentUploadConfig();
    
    upload.single('document')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      const options = {
        uploadType: 'document' as const,
        relatedTable: req.body.relatedTable,
        relatedId: req.body.relatedId ? parseInt(req.body.relatedId) : undefined
      };

      const fileRecord = await fileService.saveFileRecord(req.file, options, authenticatedReq.user!.id);
      
      res.json({
        message: 'Document uploaded successfully',
        file: fileRecord,
        url: fileService.getFileUrl(fileRecord)
      });
    });
  })
);

// POST /api/files/upload/csv - Upload CSV for bulk import
router.post('/upload/csv', 
  authenticateToken, 
  requirePermission('bulk_import'),
  asyncHandler(async (req, res) => {
    const upload = fileService.getCSVUploadConfig();
    
    upload.single('csvFile')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      const options = {
        uploadType: 'bulk_import' as const
      };

      const fileRecord = await fileService.saveFileRecord(req.file, options, authenticatedReq.user!.id);
      
      // Process CSV and return preview
      const csvData = await fileService.processCSVImport(req.file.path);
      
      res.json({
        message: 'CSV uploaded successfully',
        file: fileRecord,
        preview: csvData.slice(0, 5), // First 5 rows as preview
        totalRows: csvData.length
      });
    });
  })
);

// GET /api/files/:fileId/download - Download file
router.get('/:fileId/download', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const fileId = parseInt(req.params.fileId);
    const file = await fileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'Physical file not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFilename}"`);
    res.setHeader('Content-Type', file.mimeType);
    
    res.sendFile(path.resolve(file.filePath));
  })
);

// GET /api/files/:fileId/view - View file (for images, PDFs)
router.get('/:fileId/view', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const fileId = parseInt(req.params.fileId);
    const file = await fileService.getFileById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ error: 'Physical file not found' });
    }

    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(path.resolve(file.filePath));
  })
);

// GET /api/files/by-related/:table/:id - Get files by related entity
router.get('/by-related/:table/:id', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { table, id } = req.params;
    const files = await fileService.getFilesByRelated(table, parseInt(id));
    
    const filesWithUrls = files.map(file => ({
      ...file,
      url: fileService.getFileUrl(file)
    }));
    
    res.json(filesWithUrls);
  })
);

// GET /api/files/by-type/:type - Get files by type
router.get('/by-type/:type', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    
    const files = await fileService.getFilesByType(type, limit, offset);
    
    const filesWithUrls = files.map(file => ({
      ...file,
      url: fileService.getFileUrl(file)
    }));
    
    res.json({
      files: filesWithUrls,
      page,
      limit,
      hasMore: files.length === limit
    });
  })
);

// DELETE /api/files/:fileId - Delete file
router.delete('/:fileId', 
  authenticateToken, 
  requirePermission('delete_files'),
  asyncHandler(async (req, res) => {
    const fileId = parseInt(req.params.fileId);
    const authenticatedReq = req as AuthenticatedRequest;
    
    const success = await fileService.deleteFile(fileId, authenticatedReq.user!.id);
    
    if (success) {
      res.json({ message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  })
);

// GET /api/files/stats - Get file statistics
router.get('/stats', 
  authenticateToken,
  asyncHandler(async (req, res) => {
    const stats = await fileService.getFileStats();
    res.json(stats);
  })
);

// POST /api/files/cleanup - Cleanup old temporary files
router.post('/cleanup', 
  authenticateToken, 
  requirePermission('system_admin'),
  asyncHandler(async (req, res) => {
    const daysOld = parseInt(req.body.daysOld) || 30;
    const deletedCount = await fileService.cleanupOldFiles(daysOld);
    
    res.json({ 
      message: `Cleanup completed. Deleted ${deletedCount} old files.`,
      deletedCount 
    });
  })
);

export default router;
