import { DatabaseManager } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

export interface WhatsAppMessage {
  recipientPhone: string;
  recipientName: string;
  messageContent: string;
  templateId?: number;
  messageType: 'individual' | 'bulk' | 'automated';
  scheduledTime?: Date;
  studentId?: number;
  sentBy: number;
}

export interface WhatsAppTemplate {
  name: string;
  templateType: 'result_notification' | 'congratulations' | 'reminder' | 'celebration' | 'announcement';
  messageTemplate: string;
  messageTemplateTelugu?: string;
  variables: string[];
}

export interface BulkMessageRequest {
  templateId: number;
  targetAudience: 'parents' | 'all_parents' | 'class_parents';
  classId?: number;
  sectionId?: number;
  variables?: Record<string, any>;
  language?: 'english' | 'telugu';
  scheduledTime?: Date;
  sentBy: number;
}

export interface AutomationRule {
  ruleName: string;
  triggerEvent: 'exam_completed' | 'marks_entered' | 'birthday' | 'fee_due' | 'attendance_low';
  templateId: number;
  conditions: any;
  targetAudience: 'parents' | 'students' | 'teachers';
  isActive: boolean;
}

export class WhatsAppService {
  private dbManager: DatabaseManager;
  private isEnabled: boolean = false;
  private apiToken: string = '';
  private apiUrl: string = '';

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.initializeWhatsApp();
  }

  private async initializeWhatsApp(): Promise<void> {
    try {
      // Get WhatsApp configuration from database
      const config = await this.getWhatsAppConfig();
      
      if (config.enabled && config.apiToken) {
        this.isEnabled = true;
        this.apiToken = config.apiToken;
        this.apiUrl = config.apiUrl || 'https://api.whatsapp.com/send';
        logger.info('WhatsApp service initialized successfully');
      } else {
        logger.warn('WhatsApp service disabled or not configured');
      }
    } catch (error) {
      logger.error('Failed to initialize WhatsApp service:', error);
    }
  }

  public async sendIndividualMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      if (!this.isEnabled) {
        logger.warn('WhatsApp service is disabled');
        return false;
      }

      // Save message to database first
      const messageId = await this.saveMessage(message);

      // Send via WhatsApp API (simulated for now)
      const success = await this.sendViaAPI(message);

      // Update message status
      await this.updateMessageStatus(messageId, success ? 'sent' : 'failed');

      return success;
    } catch (error) {
      logger.error('Failed to send individual WhatsApp message:', error);
      return false;
    }
  }

  public async sendBulkMessages(request: BulkMessageRequest): Promise<{ sent: number; failed: number }> {
    try {
      let sent = 0;
      let failed = 0;

      // Get template
      const template = await this.getTemplate(request.templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get recipients based on target audience
      const recipients = await this.getRecipients(request);

      for (const recipient of recipients) {
        try {
          const personalizedMessage = this.personalizeMessage(template, recipient, request.variables, request.language);
          
          const message: WhatsAppMessage = {
            recipientPhone: recipient.phone,
            recipientName: recipient.name,
            messageContent: personalizedMessage,
            templateId: request.templateId,
            messageType: 'bulk',
            scheduledTime: request.scheduledTime,
            studentId: recipient.studentId,
            sentBy: request.sentBy
          };

          const success = await this.sendIndividualMessage(message);
          if (success) {
            sent++;
          } else {
            failed++;
          }

          // Add delay between messages to avoid rate limiting
          await this.delay(1000);
        } catch (error) {
          logger.error(`Failed to send message to ${recipient.phone}:`, error);
          failed++;
        }
      }

      return { sent, failed };
    } catch (error) {
      logger.error('Failed to send bulk messages:', error);
      throw error;
    }
  }

  public async sendAutomatedMessage(triggerEvent: string, eventData: any): Promise<void> {
    try {
      // Get automation rules for this event
      const rules = await this.getAutomationRules(triggerEvent);

      for (const rule of rules) {
        if (this.checkConditions(rule.conditions, eventData)) {
          await this.executeAutomationRule(rule, eventData);
        }
      }
    } catch (error) {
      logger.error('Failed to send automated message:', error);
    }
  }

  public async createTemplate(template: WhatsAppTemplate): Promise<number> {
    const query = `
      INSERT INTO whatsapp_templates (name, template_type, message_template, message_template_telugu, variables)
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await this.dbManager.runQuery(query, [
      template.name,
      template.templateType,
      template.messageTemplate,
      template.messageTemplateTelugu || null,
      JSON.stringify(template.variables)
    ]);

    return result.lastID;
  }

  public async getTemplates(): Promise<any[]> {
    const query = 'SELECT * FROM whatsapp_templates WHERE is_active = TRUE ORDER BY created_at DESC';
    return await this.dbManager.getAll(query);
  }

  public async updateTemplate(templateId: number, template: Partial<WhatsAppTemplate>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (template.name) {
      updates.push('name = ?');
      values.push(template.name);
    }
    if (template.messageTemplate) {
      updates.push('message_template = ?');
      values.push(template.messageTemplate);
    }
    if (template.messageTemplateTelugu) {
      updates.push('message_template_telugu = ?');
      values.push(template.messageTemplateTelugu);
    }
    if (template.variables) {
      updates.push('variables = ?');
      values.push(JSON.stringify(template.variables));
    }

    if (updates.length === 0) return;

    values.push(templateId);
    const query = `UPDATE whatsapp_templates SET ${updates.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, values);
  }

  public async createAutomationRule(rule: AutomationRule, createdBy: number): Promise<number> {
    const query = `
      INSERT INTO whatsapp_automation_rules (rule_name, trigger_event, template_id, conditions, target_audience, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await this.dbManager.runQuery(query, [
      rule.ruleName,
      rule.triggerEvent,
      rule.templateId,
      JSON.stringify(rule.conditions),
      rule.targetAudience,
      rule.isActive,
      createdBy
    ]);

    return result.lastID;
  }

  public async getMessageHistory(filters: any = {}): Promise<any[]> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.studentId) {
      whereClause += ' AND student_id = ?';
      params.push(filters.studentId);
    }

    if (filters.phone) {
      whereClause += ' AND recipient_phone = ?';
      params.push(filters.phone);
    }

    if (filters.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.dateFrom) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(filters.dateTo);
    }

    const query = `
      SELECT wm.*, wt.name as template_name, u.first_name || ' ' || u.last_name as sent_by_name
      FROM whatsapp_messages wm
      LEFT JOIN whatsapp_templates wt ON wm.template_id = wt.id
      LEFT JOIN users u ON wm.sent_by = u.id
      ${whereClause}
      ORDER BY wm.created_at DESC
      LIMIT 100
    `;

    return await this.dbManager.getAll(query, params);
  }

  public async getDeliveryStats(dateFrom?: string, dateTo?: string): Promise<any> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (dateFrom) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(dateTo);
    }

    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM whatsapp_messages ${whereClause})) as percentage
      FROM whatsapp_messages 
      ${whereClause}
      GROUP BY status
    `;

    return await this.dbManager.getAll(query, params);
  }

  // ============================================================================
  // AUTOMATED CELEBRATIONS & NOTIFICATIONS
  // ============================================================================

  public async sendExamResultCelebration(studentId: number, examSubjectId: number): Promise<void> {
    try {
      // Get student and exam details
      const studentDetails = await this.getStudentDetailsForNotification(studentId);
      const examDetails = await this.getExamSubjectDetails(examSubjectId);
      const marks = await this.getStudentMarks(studentId, examSubjectId);

      if (!studentDetails || !examDetails || !marks) {
        logger.warn('Insufficient data for exam result celebration');
        return;
      }

      // Get parent phone numbers
      const parents = await this.getStudentParents(studentId);

      for (const parent of parents) {
        if (!parent.whatsapp_enabled || !parent.whatsapp_number) continue;

        const variables = {
          student_name: studentDetails.first_name,
          subject: examDetails.subject_name,
          marks: marks.marks_obtained,
          total_marks: examDetails.max_marks,
          grade: marks.grade,
          school_name: 'Demo Rural School',
          percentage: Math.round((marks.marks_obtained / examDetails.max_marks) * 100)
        };

        const template = await this.getTemplateByType('result_notification');
        if (template) {
          const message = this.personalizeMessage(template, parent, variables, 'english');
          
          await this.sendIndividualMessage({
            recipientPhone: parent.whatsapp_number,
            recipientName: parent.name,
            messageContent: message,
            templateId: template.id,
            messageType: 'automated',
            studentId: studentId,
            sentBy: 1 // System user
          });
        }
      }
    } catch (error) {
      logger.error('Failed to send exam result celebration:', error);
    }
  }

  public async sendBirthdayWishes(studentId: number): Promise<void> {
    try {
      const studentDetails = await this.getStudentDetailsForNotification(studentId);
      const parents = await this.getStudentParents(studentId);

      const variables = {
        student_name: studentDetails.first_name,
        school_name: 'Demo Rural School'
      };

      const template = await this.getTemplateByType('celebration');
      if (!template) return;

      for (const parent of parents) {
        if (!parent.whatsapp_enabled || !parent.whatsapp_number) continue;

        const message = this.personalizeMessage(template, parent, variables, 'english');
        
        await this.sendIndividualMessage({
          recipientPhone: parent.whatsapp_number,
          recipientName: parent.name,
          messageContent: message,
          templateId: template.id,
          messageType: 'automated',
          studentId: studentId,
          sentBy: 1
        });
      }
    } catch (error) {
      logger.error('Failed to send birthday wishes:', error);
    }
  }

  public async sendFeeReminder(studentId: number, feeDetails: any): Promise<void> {
    try {
      const studentDetails = await this.getStudentDetailsForNotification(studentId);
      const parents = await this.getStudentParents(studentId);

      const variables = {
        student_name: studentDetails.first_name,
        class_name: studentDetails.class_name,
        amount: feeDetails.amount,
        due_date: feeDetails.due_date,
        school_name: 'Demo Rural School'
      };

      const template = await this.getTemplateByType('reminder');
      if (!template) return;

      for (const parent of parents) {
        if (!parent.whatsapp_enabled || !parent.whatsapp_number) continue;

        const message = this.personalizeMessage(template, parent, variables, 'english');
        
        await this.sendIndividualMessage({
          recipientPhone: parent.whatsapp_number,
          recipientName: parent.name,
          messageContent: message,
          templateId: template.id,
          messageType: 'automated',
          studentId: studentId,
          sentBy: 1
        });
      }
    } catch (error) {
      logger.error('Failed to send fee reminder:', error);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async getWhatsAppConfig(): Promise<any> {
    const query = `
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE category = 'whatsapp'
    `;
    
    const settings = await this.dbManager.getAll(query);
    const config: any = {};
    
    settings.forEach(setting => {
      config[setting.setting_key.replace('whatsapp_', '')] = setting.setting_value;
    });

    return config;
  }

  private async saveMessage(message: WhatsAppMessage): Promise<number> {
    const query = `
      INSERT INTO whatsapp_messages (recipient_phone, recipient_name, message_content, template_id, message_type, scheduled_time, student_id, sent_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const result = await this.dbManager.runQuery(query, [
      message.recipientPhone,
      message.recipientName,
      message.messageContent,
      message.templateId || null,
      message.messageType,
      message.scheduledTime ? message.scheduledTime.toISOString() : null,
      message.studentId || null,
      message.sentBy
    ]);

    return result.lastID;
  }

  private async sendViaAPI(message: WhatsAppMessage): Promise<boolean> {
    try {
      // This is a simulation - in production, integrate with actual WhatsApp Business API
      logger.info(`WhatsApp message sent to ${message.recipientPhone}: ${message.messageContent.substring(0, 50)}...`);
      
      // Simulate API call delay
      await this.delay(500);
      
      // Simulate 95% success rate
      return Math.random() > 0.05;
    } catch (error) {
      logger.error('WhatsApp API error:', error);
      return false;
    }
  }

  private async updateMessageStatus(messageId: number, status: string): Promise<void> {
    const query = `
      UPDATE whatsapp_messages 
      SET status = ?, sent_time = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_time END
      WHERE id = ?
    `;

    await this.dbManager.runQuery(query, [status, status, messageId]);
  }

  private async getTemplate(templateId: number): Promise<any> {
    const query = 'SELECT * FROM whatsapp_templates WHERE id = ? AND is_active = TRUE';
    return await this.dbManager.getOne(query, [templateId]);
  }

  private async getTemplateByType(templateType: string): Promise<any> {
    const query = 'SELECT * FROM whatsapp_templates WHERE template_type = ? AND is_active = TRUE LIMIT 1';
    return await this.dbManager.getOne(query, [templateType]);
  }

  private async getRecipients(request: BulkMessageRequest): Promise<any[]> {
    let query = '';
    let params: any[] = [];

    if (request.targetAudience === 'all_parents') {
      query = `
        SELECT DISTINCT p.whatsapp_number as phone, p.name, p.student_id
        FROM parents p
        WHERE p.whatsapp_enabled = TRUE AND p.whatsapp_number IS NOT NULL
      `;
    } else if (request.targetAudience === 'class_parents' && request.classId) {
      query = `
        SELECT DISTINCT p.whatsapp_number as phone, p.name, p.student_id
        FROM parents p
        JOIN students s ON p.student_id = s.id
        JOIN sections sec ON s.section_id = sec.id
        WHERE p.whatsapp_enabled = TRUE 
          AND p.whatsapp_number IS NOT NULL
          AND sec.class_id = ?
      `;
      params.push(request.classId);
    }

    return await this.dbManager.getAll(query, params);
  }

  private personalizeMessage(template: any, recipient: any, variables: any = {}, language: string = 'english'): string {
    let message = language === 'telugu' && template.message_template_telugu 
      ? template.message_template_telugu 
      : template.message_template;

    // Replace variables in the message
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });

    return message;
  }

  private async getAutomationRules(triggerEvent: string): Promise<any[]> {
    const query = `
      SELECT * FROM whatsapp_automation_rules 
      WHERE trigger_event = ? AND is_active = TRUE
    `;
    return await this.dbManager.getAll(query, [triggerEvent]);
  }

  private checkConditions(conditions: any, eventData: any): boolean {
    // Simple condition checking - can be made more sophisticated
    try {
      const conditionsObj = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
      // For now, return true - implement actual condition logic based on requirements
      return true;
    } catch {
      return true;
    }
  }

  private async executeAutomationRule(rule: any, eventData: any): Promise<void> {
    // Implementation depends on the specific rule and event data
    logger.info(`Executing automation rule: ${rule.rule_name}`);
  }

  private async getStudentDetailsForNotification(studentId: number): Promise<any> {
    const query = `
      SELECT s.*, c.name as class_name, sec.section_name
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      WHERE s.id = ?
    `;
    return await this.dbManager.getOne(query, [studentId]);
  }

  private async getExamSubjectDetails(examSubjectId: number): Promise<any> {
    const query = `
      SELECT es.*, sub.name as subject_name, e.name as exam_name
      FROM exam_subjects es
      JOIN subjects sub ON es.subject_id = sub.id
      JOIN exams e ON es.exam_id = e.id
      WHERE es.id = ?
    `;
    return await this.dbManager.getOne(query, [examSubjectId]);
  }

  private async getStudentMarks(studentId: number, examSubjectId: number): Promise<any> {
    const query = `
      SELECT * FROM student_marks 
      WHERE student_id = ? AND exam_subject_id = ?
    `;
    return await this.dbManager.getOne(query, [studentId, examSubjectId]);
  }

  private async getStudentParents(studentId: number): Promise<any[]> {
    const query = `
      SELECT * FROM parents 
      WHERE student_id = ? AND whatsapp_enabled = TRUE
      ORDER BY is_primary_contact DESC
    `;
    return await this.dbManager.getAll(query, [studentId]);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public isWhatsAppEnabled(): boolean {
    return this.isEnabled;
  }
}
