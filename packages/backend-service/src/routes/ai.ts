import express, { Router } from 'express';
import { AIService } from '../services/AIService';
import { ExamService } from '../services/ExamService';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = express.Router();
const aiService = new AIService();
const examService = new ExamService();

// POST /api/ai/exams/generate - Generate exam using AI
router.post('/exams/generate', asyncHandler(async (req, res) => {
  const {
    classId,
    subjectId,
    examType,
    syllabus,
    difficultyLevel,
    questionTypes,
    totalMarks,
    language = 'english'
  } = req.body;

  if (!classId || !subjectId || !examType || !syllabus) {
    return res.status(400).json({ 
      error: 'classId, subjectId, examType, and syllabus are required' 
    });
  }

  const examRequest = {
    classId,
    subjectId,
    examType,
    syllabus,
    difficultyLevel: difficultyLevel || 'Mixed',
    questionTypes: questionTypes || ['MCQ', 'Short Answer', 'Long Answer'],
    totalMarks: totalMarks || 100,
    language
  };

  const questions = await aiService.generateExamQuestions(examRequest);
  res.json({ questions });
}));

// POST /api/ai/exams/:examId/questions/generate - Generate questions for existing exam
router.post('/exams/:examId/questions/generate', asyncHandler(async (req, res) => {
  const examId = parseInt(req.params.examId);
  const {
    topic,
    difficulty = 'Medium',
    count = 10
  } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  const questions = await examService.generateQuestionsWithAI(examId, topic, difficulty, count);
  res.json({ questions });
}));

// POST /api/ai/students/:studentId/performance/predict - Get AI performance prediction
router.post('/students/:studentId/performance/predict', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const {
    subjectId,
    predictionType = 'performance',
    timeframe = 'next_exam'
  } = req.body;

  const request = {
    studentId,
    subjectId,
    predictionType,
    timeframe
  };

  const prediction = await aiService.predictStudentPerformance(request);
  res.json(prediction);
}));

// POST /api/ai/students/:studentId/recommendations - Get AI recommendations
router.post('/students/:studentId/recommendations', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const {
    type = 'study_plan',
    includeWeakAreas = true,
    includeStrengths = true,
    language = 'english'
  } = req.body;

  const recommendations = await aiService.generatePersonalizedRecommendations(
    studentId, 
    language as 'english' | 'telugu'
  );
  res.json(recommendations);
}));

// POST /api/ai/reports/generate - Generate AI-powered reports
router.post('/reports/generate', asyncHandler(async (req, res) => {
  const {
    studentId,
    language = 'english'
  } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'Student ID is required' });
  }

  const report = await aiService.generateStudentReport(studentId, language as 'english' | 'telugu');
  res.json({ report });
}));

// POST /api/ai/content/translate - Translate content using AI
router.post('/content/translate', asyncHandler(async (req, res) => {
  const {
    content,
    fromLanguage = 'english',
    toLanguage = 'telugu'
  } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required for translation' });
  }

  const translatedContent = await aiService.translateContent(content, fromLanguage, toLanguage);
  res.json({ 
    originalContent: content,
    translatedContent,
    fromLanguage,
    toLanguage
  });
}));

// POST /api/ai/tutoring/chat - AI tutoring chat
router.post('/tutoring/chat', asyncHandler(async (req, res) => {
  const {
    studentId,
    question,
    subject,
    language = 'english'
  } = req.body;

  if (!studentId || !question) {
    return res.status(400).json({ error: 'Student ID and question are required' });
  }

  const response = await aiService.generateTutoringResponse(
    parseInt(studentId), 
    question, 
    subject, 
    language as 'english' | 'telugu'
  );
  
  res.json({ 
    question,
    response,
    subject: subject || 'General',
    language,
    timestamp: new Date().toISOString()
  });
}));

// GET /api/ai/status - Get AI service status
router.get('/status', asyncHandler(async (req, res) => {
  const isEnabled = aiService.isAIEnabled();
  res.json({ 
    enabled: isEnabled,
    features: [
      'exam_generation', 
      'performance_prediction', 
      'recommendations', 
      'reports',
      'translation',
      'tutoring_chat',
      'learning_paths',
      'study_materials'
    ],
    model: 'gemini-pro',
    status: isEnabled ? 'active' : 'disabled'
  });
}));

// POST /api/ai/learning-paths/:studentId - Generate personalized learning path
router.post('/learning-paths/:studentId', asyncHandler(async (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const {
    subject,
    language = 'english'
  } = req.body;

  const learningPath = await aiService.generatePersonalizedLearningPath(
    studentId, 
    subject, 
    language as 'english' | 'telugu'
  );
  
  res.json({ 
    studentId,
    subject: subject || 'All subjects',
    learningPath,
    language,
    generatedAt: new Date().toISOString()
  });
}));

// POST /api/ai/study-materials/generate - Generate study materials
router.post('/study-materials/generate', asyncHandler(async (req, res) => {
  const {
    topic,
    classLevel,
    subject,
    materialType = 'summary',
    language = 'english'
  } = req.body;

  if (!topic || !classLevel || !subject) {
    return res.status(400).json({ 
      error: 'Topic, class level, and subject are required' 
    });
  }

  const validMaterialTypes = ['summary', 'notes', 'practice_questions', 'flashcards'];
  if (!validMaterialTypes.includes(materialType)) {
    return res.status(400).json({ 
      error: `Material type must be one of: ${validMaterialTypes.join(', ')}` 
    });
  }

  const studyMaterials = await aiService.generateStudyMaterials(
    topic,
    parseInt(classLevel),
    subject,
    materialType,
    language as 'english' | 'telugu'
  );
  
  res.json({ 
    topic,
    classLevel: parseInt(classLevel),
    subject,
    materialType,
    language,
    materials: studyMaterials,
    generatedAt: new Date().toISOString()
  });
}));

export default router;
