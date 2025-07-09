import express, { Router } from 'express';
import { WhatsAppService } from '../services/WhatsAppService';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();
const whatsappService = new WhatsAppService();

// POST /api/whatsapp/send/individual - Send individual message
router.post('/send/individual', asyncHandler(async (req, res) => {
  const messageData = req.body;

  if (!messageData.phoneNumber || !messageData.message) {
    return res.status(400).json({ 
      error: 'Phone number and message are required' 
    });
  }

  const result = await whatsappService.sendIndividualMessage(messageData);
  res.json({ success: result });
}));

// POST /api/whatsapp/send/bulk - Send bulk messages
router.post('/send/bulk', asyncHandler(async (req, res) => {
  const bulkRequest = req.body;

  if (!bulkRequest.recipients || !Array.isArray(bulkRequest.recipients)) {
    return res.status(400).json({ error: 'Recipients array is required' });
  }

  const result = await whatsappService.sendBulkMessages(bulkRequest);
  res.json(result);
}));

// POST /api/whatsapp/exam-results/celebrate - Send exam result celebration
router.post('/exam-results/celebrate', asyncHandler(async (req, res) => {
  const { studentId, examSubjectId } = req.body;

  if (!studentId || !examSubjectId) {
    return res.status(400).json({ error: 'Student ID and exam subject ID are required' });
  }

  await whatsappService.sendExamResultCelebration(studentId, examSubjectId);
  res.json({ message: 'Celebration message sent successfully' });
}));

// POST /api/whatsapp/birthday-wishes - Send birthday wishes
router.post('/birthday-wishes', asyncHandler(async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  await whatsappService.sendBirthdayWishes(studentId);
  res.json({ message: 'Birthday wishes sent successfully' });
}));

// POST /api/whatsapp/fee-reminder - Send fee reminder
router.post('/fee-reminder', asyncHandler(async (req, res) => {
  const { studentId, feeDetails } = req.body;

  if (!studentId || !feeDetails) {
    return res.status(400).json({ error: 'Student ID and fee details are required' });
  }

  await whatsappService.sendFeeReminder(studentId, feeDetails);
  res.json({ message: 'Fee reminder sent successfully' });
}));

// POST /api/whatsapp/automated - Send automated message
router.post('/automated', asyncHandler(async (req, res) => {
  const { triggerEvent, eventData } = req.body;

  if (!triggerEvent || !eventData) {
    return res.status(400).json({ error: 'Trigger event and event data are required' });
  }

  await whatsappService.sendAutomatedMessage(triggerEvent, eventData);
  res.json({ message: 'Automated message sent successfully' });
}));

// GET /api/whatsapp/templates - Get all message templates
router.get('/templates', asyncHandler(async (req, res) => {
  const templates = await whatsappService.getTemplates();
  res.json(templates);
}));

// POST /api/whatsapp/templates - Create new message template
router.post('/templates', asyncHandler(async (req, res) => {
  const templateData = req.body;
  
  if (!templateData.name || !templateData.content) {
    return res.status(400).json({ 
      error: 'Template name and content are required' 
    });
  }

  const templateId = await whatsappService.createTemplate(templateData);
  res.status(201).json({ id: templateId, message: 'Template created successfully' });
}));

// PUT /api/whatsapp/templates/:id - Update message template
router.put('/templates/:id', asyncHandler(async (req, res) => {
  const templateId = parseInt(req.params.id);
  const templateData = req.body;
  
  await whatsappService.updateTemplate(templateId, templateData);
  res.json({ message: 'Template updated successfully' });
}));

// GET /api/whatsapp/history - Get message history
router.get('/history', asyncHandler(async (req, res) => {
  const filters = req.query;
  const history = await whatsappService.getMessageHistory(filters);
  res.json(history);
}));

// GET /api/whatsapp/stats - Get delivery statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const stats = await whatsappService.getDeliveryStats(dateFrom as string, dateTo as string);
  res.json(stats);
}));

// POST /api/whatsapp/automation-rules - Create automation rule
router.post('/automation-rules', asyncHandler(async (req, res) => {
  const ruleData = req.body;
  const { created_by } = req.body;
  
  if (!created_by) {
    return res.status(400).json({ error: 'Created by user ID is required' });
  }

  const ruleId = await whatsappService.createAutomationRule(ruleData, created_by);
  res.status(201).json({ id: ruleId, message: 'Automation rule created successfully' });
}));

// GET /api/whatsapp/status - Get WhatsApp service status
router.get('/status', asyncHandler(async (req, res) => {
  res.json({ 
    enabled: true,
    features: ['individual_messages', 'bulk_messages', 'templates', 'automation'],
    api_status: 'connected'
  });
}));

export default router;
