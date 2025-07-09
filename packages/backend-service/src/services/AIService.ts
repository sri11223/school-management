import { GoogleGenerativeAI } from '@google/generative-ai';
import { DatabaseManager } from '../database/DatabaseManager';
import { logger } from '../utils/logger';

export interface AIExamRequest {
  classId: number;
  subjectId: number;
  examType: string;
  syllabus: string;
  difficultyLevel: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  questionTypes: string[];
  totalMarks: number;
  language: 'english' | 'telugu';
}

export interface AIPerformancePrediction {
  studentId: number;
  subjectId?: number;
  predictionType: 'performance' | 'dropout_risk' | 'career_suggestion';
  timeframe: 'next_exam' | 'semester' | 'annual';
}

export interface AIRecommendation {
  type: 'study_plan' | 'weak_areas' | 'strengths' | 'career_guidance';
  content: string;
  contentTelugu?: string;
  confidence: number;
  actionItems: string[];
}

export class AIService {
  private genAI: GoogleGenerativeAI;
  private dbManager: DatabaseManager;
  private isEnabled: boolean = false;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
    this.initializeAI();
  }

  private async initializeAI(): Promise<void> {
    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      if (!apiKey) {
        logger.warn('Gemini API key not provided. AI features will be disabled.');
        return;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isEnabled = true;
      logger.info('AI Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI service:', error);
    }
  }

  public async generateExamQuestions(request: AIExamRequest): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('AI service is not enabled. Please configure Gemini API key.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = this.buildExamGenerationPrompt(request);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedContent = response.text();

      // Save to database
      await this.saveAIContent('exam_questions', request.classId, request.subjectId, prompt, generatedContent, request.language);

      return {
        questions: this.parseExamQuestions(generatedContent),
        metadata: {
          totalMarks: request.totalMarks,
          difficultyLevel: request.difficultyLevel,
          language: request.language,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to generate exam questions:', error);
      throw new Error('Failed to generate exam questions using AI');
    }
  }

  public async predictStudentPerformance(request: AIPerformancePrediction): Promise<any> {
    if (!this.isEnabled) {
      throw new Error('AI service is not enabled');
    }

    try {
      // Get student historical data
      const studentData = await this.getStudentPerformanceData(request.studentId, request.subjectId);
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = this.buildPredictionPrompt(studentData, request);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const prediction = response.text();

      // Parse and save prediction
      const parsedPrediction = this.parsePrediction(prediction);
      await this.savePrediction(request.studentId, request.predictionType, parsedPrediction);

      return parsedPrediction;
    } catch (error) {
      logger.error('Failed to predict student performance:', error);
      throw error;
    }
  }

  public async generatePersonalizedRecommendations(studentId: number, language: 'english' | 'telugu' = 'english'): Promise<AIRecommendation[]> {
    if (!this.isEnabled) {
      return this.getDefaultRecommendations(language);
    }

    try {
      const studentProfile = await this.getStudentAIProfile(studentId);
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = this.buildRecommendationPrompt(studentProfile, language);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const recommendations = response.text();

      return this.parseRecommendations(recommendations, language);
    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      return this.getDefaultRecommendations(language);
    }
  }

  public async generateStudentReport(studentId: number, language: 'english' | 'telugu' = 'english'): Promise<string> {
    if (!this.isEnabled) {
      return this.generateBasicReport(studentId, language);
    }

    try {
      const studentData = await this.getCompleteStudentData(studentId);
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = this.buildReportPrompt(studentData, language);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      logger.error('Failed to generate AI report:', error);
      return this.generateBasicReport(studentId, language);
    }
  }

  public async detectLearningStyle(studentId: number): Promise<string> {
    try {
      const performanceData = await this.getStudentPerformanceData(studentId);
      
      if (!this.isEnabled) {
        return this.basicLearningStyleDetection(performanceData);
      }

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `
        Based on the following student performance data, identify the learning style:
        ${JSON.stringify(performanceData, null, 2)}
        
        Respond with one of: Visual, Auditory, Kinesthetic, Reading/Writing
        Also provide a brief explanation.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      logger.error('Failed to detect learning style:', error);
      return 'Visual'; // Default fallback
    }
  }

  private buildExamGenerationPrompt(request: AIExamRequest): string {
    const languageInstruction = request.language === 'telugu' 
      ? 'Generate questions in Telugu script with English subjects/formulas where needed.'
      : 'Generate questions in English.';

    return `
      Generate an exam question paper with the following specifications:
      
      Class: ${request.classId}
      Subject: ${request.subjectId}
      Exam Type: ${request.examType}
      Total Marks: ${request.totalMarks}
      Difficulty: ${request.difficultyLevel}
      Question Types: ${request.questionTypes.join(', ')}
      Language: ${request.language}
      Syllabus Topics: ${request.syllabus}
      
      ${languageInstruction}
      
      Requirements:
      1. Include a variety of question types as specified
      2. Distribute marks appropriately
      3. Include clear instructions
      4. Ensure age-appropriate language
      5. Follow Indian curriculum standards
      6. Include marking scheme
      
      Format the output as JSON with questions, marks, and instructions.
    `;
  }

  private buildPredictionPrompt(studentData: any, request: AIPerformancePrediction): string {
    return `
      Analyze the following student performance data and make predictions:
      
      Student Data: ${JSON.stringify(studentData, null, 2)}
      Prediction Type: ${request.predictionType}
      Timeframe: ${request.timeframe}
      
      Based on this data, provide:
      1. Predicted performance/outcome
      2. Confidence level (0-100%)
      3. Key factors influencing the prediction
      4. Recommended interventions
      5. Risk assessment
      
      Format as JSON with clear structure.
    `;
  }

  private buildRecommendationPrompt(studentProfile: any, language: string): string {
    const languageInstruction = language === 'telugu' 
      ? 'Provide recommendations in Telugu script.'
      : 'Provide recommendations in English.';

    return `
      Generate personalized learning recommendations for this student:
      
      Student Profile: ${JSON.stringify(studentProfile, null, 2)}
      
      ${languageInstruction}
      
      Provide specific recommendations for:
      1. Study techniques
      2. Time management
      3. Weak area improvement
      4. Strength development
      5. Career guidance (if applicable)
      
      Make recommendations practical and age-appropriate.
    `;
  }

  private buildReportPrompt(studentData: any, language: string): string {
    const languageInstruction = language === 'telugu' 
      ? 'Generate the report in Telugu script with a warm, encouraging tone.'
      : 'Generate the report in English with a warm, encouraging tone.';

    return `
      Generate a comprehensive student progress report:
      
      Student Data: ${JSON.stringify(studentData, null, 2)}
      
      ${languageInstruction}
      
      Include:
      1. Overall academic performance summary
      2. Subject-wise analysis
      3. Strengths and achievements
      4. Areas for improvement
      5. Behavioral observations
      6. Recommendations for parents
      7. Future goals and action plan
      
      Write in a positive, constructive manner suitable for parents.
    `;
  }

  private async getStudentPerformanceData(studentId: number, subjectId?: number): Promise<any> {
    const whereClause = subjectId ? 'AND es.subject_id = ?' : '';
    const params = subjectId ? [studentId, subjectId] : [studentId];

    const query = `
      SELECT 
        s.*, 
        sm.marks_obtained, 
        sm.grade,
        es.max_marks,
        sub.name as subject_name,
        e.name as exam_name,
        et.name as exam_type
      FROM students s
      LEFT JOIN student_marks sm ON s.id = sm.student_id
      LEFT JOIN exam_subjects es ON sm.exam_subject_id = es.id
      LEFT JOIN exams e ON es.exam_id = e.id
      LEFT JOIN exam_types et ON e.exam_type_id = et.id
      LEFT JOIN subjects sub ON es.subject_id = sub.id
      WHERE s.id = ? ${whereClause}
      ORDER BY e.start_date DESC
    `;

    return await this.dbManager.getAll(query, params);
  }

  private async getStudentAIProfile(studentId: number): Promise<any> {
    const query = `
      SELECT 
        s.*,
        sec.section_name,
        c.name as class_name,
        (SELECT AVG(sm.marks_obtained) FROM student_marks sm 
         JOIN exam_subjects es ON sm.exam_subject_id = es.id 
         WHERE sm.student_id = s.id) as avg_marks,
        (SELECT COUNT(*) FROM attendance_records ar 
         WHERE ar.student_id = s.id AND ar.status = 'Present') as present_days,
        (SELECT COUNT(*) FROM attendance_records ar 
         WHERE ar.student_id = s.id) as total_days
      FROM students s
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN classes c ON sec.class_id = c.id
      WHERE s.id = ?
    `;

    return await this.dbManager.getOne(query, [studentId]);
  }

  private async getCompleteStudentData(studentId: number): Promise<any> {
    const studentProfile = await this.getStudentAIProfile(studentId);
    const performanceData = await this.getStudentPerformanceData(studentId);
    const attendanceData = await this.getAttendanceData(studentId);

    return {
      profile: studentProfile,
      performance: performanceData,
      attendance: attendanceData
    };
  }

  private async getAttendanceData(studentId: number): Promise<any> {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM attendance_records WHERE student_id = ?)) as percentage
      FROM attendance_records 
      WHERE student_id = ?
      GROUP BY status
    `;

    return await this.dbManager.getAll(query, [studentId, studentId]);
  }

  private async saveAIContent(contentType: string, classId: number, subjectId: number, prompt: string, content: string, language: string): Promise<void> {
    const query = `
      INSERT INTO ai_generated_content (content_type, class_id, subject_id, prompt_used, generated_content, language, generated_by, ai_model)
      VALUES (?, ?, ?, ?, ?, ?, 1, 'gemini-pro')
    `;

    await this.dbManager.runQuery(query, [contentType, classId, subjectId, prompt, content, language]);
  }

  private async savePrediction(studentId: number, predictionType: string, prediction: any): Promise<void> {
    const query = `
      INSERT INTO ai_predictions (student_id, prediction_type, predicted_value, confidence_score, factors_considered, valid_until)
      VALUES (?, ?, ?, ?, ?, DATE('now', '+30 days'))
    `;

    await this.dbManager.runQuery(query, [
      studentId,
      predictionType,
      JSON.stringify(prediction.value),
      prediction.confidence || 0.5,
      JSON.stringify(prediction.factors || [])
    ]);
  }

  private parseExamQuestions(generatedContent: string): any {
    try {
      // Try to parse as JSON first
      return JSON.parse(generatedContent);
    } catch {
      // If not JSON, parse as text and structure it
      return {
        content: generatedContent,
        parsed: false,
        instructions: 'Please review and format the generated content'
      };
    }
  }

  private parsePrediction(prediction: string): any {
    try {
      return JSON.parse(prediction);
    } catch {
      return {
        value: prediction,
        confidence: 0.7,
        factors: ['AI analysis of historical performance'],
        recommendations: ['Continue monitoring student progress']
      };
    }
  }

  private parseRecommendations(recommendations: string, language: string): AIRecommendation[] {
    // Basic parsing - in production, this would be more sophisticated
    const lines = recommendations.split('\n').filter(line => line.trim());
    
    return lines.map((line, index) => ({
      type: index === 0 ? 'study_plan' : 'weak_areas',
      content: line.trim(),
      confidence: 0.8,
      actionItems: [line.trim()]
    }));
  }

  private getDefaultRecommendations(language: string): AIRecommendation[] {
    if (language === 'telugu') {
      return [
        {
          type: 'study_plan',
          content: 'రోజూ 2 గంటలు చదువుకోండి మరియు వారానికి ఒకసారి పునరావృతం చేయండి',
          confidence: 0.8,
          actionItems: ['రోజువారీ టైమ్ టేబుల్ తయారు చేయండి', 'కష్టమైన విషయాలను ముందుగా చదవండి']
        }
      ];
    }

    return [
      {
        type: 'study_plan',
        content: 'Study for 2 hours daily and review weekly',
        confidence: 0.8,
        actionItems: ['Create a daily schedule', 'Focus on difficult subjects first']
      }
    ];
  }

  private async generateBasicReport(studentId: number, language: string): Promise<string> {
    const studentData = await this.getCompleteStudentData(studentId);
    
    if (language === 'telugu') {
      return `${studentData.profile.first_name} యొక్క పురోగతి రిపోర్ట్: విద్యార్థి మంచి పురోగతి సాధిస్తున్నారు.`;
    }

    return `Progress Report for ${studentData.profile.first_name}: Student is making good progress in studies.`;
  }

  private basicLearningStyleDetection(performanceData: any): string {
    // Simple heuristic-based detection
    if (!performanceData || performanceData.length === 0) {
      return 'Visual';
    }

    // This is a simplified version - in production, you'd use more sophisticated analysis
    const mathScores = performanceData.filter((p: any) => p.subject_name?.toLowerCase().includes('math'));
    const scienceScores = performanceData.filter((p: any) => p.subject_name?.toLowerCase().includes('science'));
    
    if (mathScores.length > scienceScores.length) {
      return 'Analytical';
    }
    
    return 'Visual';
  }

  public isAIEnabled(): boolean {
    return this.isEnabled;
  }

  // ============================================================================
  // ADVANCED AI METHODS
  // ============================================================================

  public async translateContent(content: string, fromLanguage: string, toLanguage: string): Promise<string> {
    if (!this.isEnabled) {
      return content; // Return original if AI not enabled
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `
        Translate the following text from ${fromLanguage} to ${toLanguage}.
        Maintain the tone, context, and educational terminology appropriately.
        
        Text to translate: ${content}
        
        Provide only the translated text without any additional commentary.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
    } catch (error) {
      logger.error('Failed to translate content:', error);
      return content;
    }
  }

  public async generateTutoringResponse(studentId: number, question: string, subject?: string, language: 'english' | 'telugu' = 'english'): Promise<string> {
    if (!this.isEnabled) {
      return language === 'telugu' 
        ? 'క్షమించండి, AI ట్యూటరింగ్ ప్రస్తుతం అందుబాటులో లేదు.'
        : 'Sorry, AI tutoring is currently not available.';
    }

    try {
      const studentProfile = await this.getStudentAIProfile(studentId);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const languageInstruction = language === 'telugu' 
        ? 'Respond in Telugu script with simple, encouraging language suitable for the student\'s age.'
        : 'Respond in English with simple, encouraging language suitable for the student\'s age.';

      const prompt = `
        You are a friendly AI tutor helping a student from rural India.
        
        Student Details: Grade ${studentProfile?.class_name || 'unknown'}, Age-appropriate responses needed.
        Subject Context: ${subject || 'General'}
        Student Question: ${question}
        
        ${languageInstruction}
        
        Provide:
        1. A clear, step-by-step explanation
        2. Simple examples if applicable
        3. Encouraging words
        4. Next steps for learning
        
        Keep the response educational, supportive, and age-appropriate.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // Save tutoring session
      await this.saveTutoringSession(studentId, question, response.text(), subject);
      
      return response.text();
    } catch (error) {
      logger.error('Failed to generate tutoring response:', error);
      return language === 'telugu' 
        ? 'క్షమించండి, మీ ప్రశ్నకు సమాధానం ఇవ్వలేకపోతున్నాను. దయచేసి మళ్లీ ప్రయత్నించండి.'
        : 'Sorry, I couldn\'t answer your question right now. Please try again.';
    }
  }

  public async generatePersonalizedLearningPath(studentId: number, subject?: string, language: 'english' | 'telugu' = 'english'): Promise<any> {
    if (!this.isEnabled) {
      return this.getDefaultLearningPath(language);
    }

    try {
      const studentData = await this.getCompleteStudentData(studentId);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const languageInstruction = language === 'telugu' 
        ? 'Create the learning path in Telugu script.'
        : 'Create the learning path in English.';

      const prompt = `
        Create a personalized learning path for this student:
        
        Student Data: ${JSON.stringify(studentData, null, 2)}
        Subject Focus: ${subject || 'All subjects'}
        
        ${languageInstruction}
        
        Create a 30-day learning plan with:
        1. Daily goals and activities
        2. Weekly milestones
        3. Strengths to build upon
        4. Weak areas to improve
        5. Fun activities and rewards
        6. Progress tracking methods
        
        Make it practical for a rural Indian school setting.
        Format as JSON with clear structure.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const learningPath = this.parseLearningPath(response.text());
      
      // Save learning path
      await this.saveLearningPath(studentId, learningPath, subject);
      
      return learningPath;
    } catch (error) {
      logger.error('Failed to generate learning path:', error);
      return this.getDefaultLearningPath(language);
    }
  }

  public async generateStudyMaterials(topic: string, classLevel: number, subject: string, materialType: 'summary' | 'notes' | 'practice_questions' | 'flashcards', language: 'english' | 'telugu' = 'english'): Promise<any> {
    if (!this.isEnabled) {
      return this.getDefaultStudyMaterials(topic, materialType, language);
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const languageInstruction = language === 'telugu' 
        ? 'Generate content in Telugu script with English terms for scientific/mathematical concepts where needed.'
        : 'Generate content in English with simple, clear language.';

      let promptDetails = '';
      switch (materialType) {
        case 'summary':
          promptDetails = 'Create a comprehensive summary with key points, important concepts, and easy-to-remember facts.';
          break;
        case 'notes':
          promptDetails = 'Create detailed study notes with explanations, examples, and visual descriptions where helpful.';
          break;
        case 'practice_questions':
          promptDetails = 'Create practice questions with varying difficulty levels, including answers and explanations.';
          break;
        case 'flashcards':
          promptDetails = 'Create flashcard-style content with questions on one side and answers/explanations on the other.';
          break;
      }

      const prompt = `
        Generate ${materialType} for:
        
        Topic: ${topic}
        Subject: ${subject}
        Class Level: ${classLevel}
        
        ${languageInstruction}
        ${promptDetails}
        
        Requirements:
        1. Age-appropriate for class ${classLevel}
        2. Aligned with Indian curriculum standards
        3. Include practical examples from rural Indian context
        4. Make it engaging and easy to understand
        5. Include memory aids and tips
        
        Format as JSON with structured content.
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const studyMaterials = this.parseStudyMaterials(response.text(), materialType);
      
      // Save study materials
      await this.saveStudyMaterials(topic, subject, classLevel, materialType, studyMaterials, language);
      
      return studyMaterials;
    } catch (error) {
      logger.error('Failed to generate study materials:', error);
      return this.getDefaultStudyMaterials(topic, materialType, language);
    }
  }

  // ============================================================================
  // HELPER METHODS FOR ADVANCED FEATURES
  // ============================================================================

  private async saveTutoringSession(studentId: number, question: string, response: string, subject?: string): Promise<void> {
    const query = `
      INSERT INTO ai_tutoring_sessions (student_id, question, ai_response, subject, session_time)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await this.dbManager.runQuery(query, [studentId, question, response, subject || 'General']);
  }

  private async saveLearningPath(studentId: number, learningPath: any, subject?: string): Promise<void> {
    const query = `
      INSERT INTO ai_learning_paths (student_id, subject, learning_path_data, generated_at, valid_until)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, DATE('now', '+30 days'))
    `;

    await this.dbManager.runQuery(query, [studentId, subject || 'All', JSON.stringify(learningPath)]);
  }

  private async saveStudyMaterials(topic: string, subject: string, classLevel: number, materialType: string, materials: any, language: string): Promise<void> {
    const query = `
      INSERT INTO ai_study_materials (topic, subject, class_level, material_type, content_data, language, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    await this.dbManager.runQuery(query, [topic, subject, classLevel, materialType, JSON.stringify(materials), language]);
  }

  private parseLearningPath(content: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return {
        title: 'Personalized Learning Path',
        duration: '30 days',
        content: content,
        dailyGoals: ['Study regularly', 'Practice problems', 'Review notes'],
        weeklyMilestones: ['Complete chapter 1', 'Take practice test', 'Review weak areas'],
        parsed: false
      };
    }
  }

  private parseStudyMaterials(content: string, materialType: string): any {
    try {
      return JSON.parse(content);
    } catch {
      return {
        type: materialType,
        content: content,
        generatedAt: new Date().toISOString(),
        parsed: false
      };
    }
  }

  private getDefaultLearningPath(language: string): any {
    if (language === 'telugu') {
      return {
        title: 'వ్యక్తిగత అభ్యాస మార్గం',
        duration: '30 రోజులు',
        dailyGoals: ['రోజువారీ 2 గంటలు చదవండి', 'సమస్యలను సాధన చేయండి'],
        weeklyMilestones: ['వారానికి ఒక అధ్యాయం పూర్తి చేయండి'],
        tips: ['రోజువారీ సమయ పట్టిక వేసుకోండి']
      };
    }

    return {
      title: 'Personalized Learning Path',
      duration: '30 days',
      dailyGoals: ['Study 2 hours daily', 'Practice problems'],
      weeklyMilestones: ['Complete one chapter per week'],
      tips: ['Create a daily schedule']
    };
  }

  private getDefaultStudyMaterials(topic: string, materialType: string, language: string): any {
    if (language === 'telugu') {
      return {
        type: materialType,
        topic: topic,
        content: `${topic} గురించి అధ్యాయన సామగ్రి ప్రస్తుతం అందుబాటులో లేదు.`,
        note: 'AI సేవ ప్రారంభించబడలేదు'
      };
    }

    return {
      type: materialType,
      topic: topic,
      content: `Study materials for ${topic} are not available at the moment.`,
      note: 'AI service not enabled'
    };
  }
}
