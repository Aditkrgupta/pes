import { Router } from "express";
import multer from "multer";

import { removeTAFromBatch } from "../../controllers/teacher/removeTAFromBatch.controller.ts";
import {
  getAllEscalatedTickets,
  getResolvedTickets,
  resolveTicket,
} from "../../controllers/teacher/teacherEscalatedTicket.controller.ts";

import { authMiddleware } from "../../middlewares/authMiddleware.ts";
import { getTeacherCourses } from "../../controllers/teacher/getTeacherCourses.controller.ts";
import { getExamsByCourse } from "../../controllers/teacher/getExamsByCourse.controller.ts";
import { getTeacherDashboardStats } from "../../controllers/teacher/dashboardStats.controller.ts";
import {
  createExam,
  getSingleExam,
  updateExam,
  deleteExam,
  getExamSubmissions,
  uploadAnswerKey,
  getAllExamsForTeacher,
  uploadQuestionPaper,
} from "../../controllers/teacher/exam.controller.ts";
import { getBatchStudents } from "../../controllers/teacher/getBatchStudents.controller.ts";
import { initiatePeerEvaluation } from "../../controllers/teacher/peerEvaluation.controller.ts";
import { assignTaToBatch } from "../../controllers/teacher/assignTaToBatch.controller.ts";
import {
  getAllStudents,
  getTaCandidates,
} from "../../controllers/teacher/getAllStudents.controller.ts";
import { enrollStudents } from "../../controllers/teacher/teacherEnroll.controller.ts";
import { getBatchStudents2 } from "../../controllers/teacher/teacherEnroll.controller.ts";
import { getBatchTA } from "../../controllers/teacher/getBatchTA.controller.ts";
import { generateQrPdfBundle } from "../../controllers/teacher/generateExamQrPdfBundle.controller.ts";
import { handleBulkUploadScans } from "../../controllers/teacher/handleBulkUploadScans.controller.ts";
import { generateTicketsForPendingEvaluations } from "../../controllers/teacher/markUnevaluated.controller.ts";
import { generateEvaluationStatistics } from "../../controllers/teacher/statistics.controller.ts";
import { filterStudents } from "../../controllers/teacher/filterStudents.Controller.ts";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Courses
router.get("/courses", authMiddleware, getTeacherCourses);
router.get("/courses/:courseId/exams", authMiddleware, getExamsByCourse);

// Dashboard Stats
router.get("/dashboard-stats", authMiddleware, getTeacherDashboardStats);

// Exam CRUD + Submissions
router.get("/exams", authMiddleware, getAllExamsForTeacher);
router.post("/exams", authMiddleware, createExam);
router.get("/exams/:examId", authMiddleware, getSingleExam);
router.put("/exams/:examId", authMiddleware, updateExam);
router.delete("/exams/:examId", authMiddleware, deleteExam);
router.get("/exams/:examId/submissions", authMiddleware, getExamSubmissions);
router.post(
  "/exams/:examId/question-paper",
  authMiddleware,
  upload.single("questionPaperPdf"),
  uploadQuestionPaper
);
router.post(
  "/:examId/answer-key",
  authMiddleware,
  upload.single("answerKeyPdf"),
  uploadAnswerKey
);


// Flagging Evaluations
router.post(
  "/exams/:examId/generate-pending",
  authMiddleware,
  generateTicketsForPendingEvaluations
);

router.post("/exams/:examId/send-flagged-evaluations", authMiddleware, generateEvaluationStatistics);

// Batch & TA
router.get("/batch/:batchId/students", authMiddleware, getBatchStudents);
router.post("/initiate-evaluation", authMiddleware, initiatePeerEvaluation);
router.post("/batch/:batchId/assign-ta", authMiddleware, assignTaToBatch);
router.delete(
  "/batch/:batchId/remove-ta/:taId",
  authMiddleware,
  removeTAFromBatch
);
router.get("/batch/:batchId/ta", authMiddleware, getBatchTA);
router.get("/students", authMiddleware, getAllStudents);
router.post('/filter',authMiddleware,filterStudents)
router.post("/enroll", authMiddleware, enrollStudents);
router.get("/batch/:batchId/students", authMiddleware, getBatchStudents2);
router.get("/ta-candidates/:courseId", authMiddleware, getTaCandidates);
// QR Code Uploads
router.get("/exam/:examId/generate-qrs", authMiddleware, generateQrPdfBundle);
router.post(
  "/exams/:examId/upload-scans",
  authMiddleware,
  upload.array("scannedPdfs"),
  handleBulkUploadScans
);

// Escalated Tickets
router.get("/escalated-tickets", authMiddleware, getAllEscalatedTickets);
router.put("/resolve-ticket/:ticketId", authMiddleware, resolveTicket);
router.get("/resolved-tickets", authMiddleware, getResolvedTickets);

export default router;
