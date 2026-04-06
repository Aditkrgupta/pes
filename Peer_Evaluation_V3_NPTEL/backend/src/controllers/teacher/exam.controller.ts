import { Request, Response, NextFunction } from "express";
import { Exam } from "../../models/Exam.ts";
import { Submission } from "../../models/Submission.ts";
import { Batch } from "../../models/Batch.ts";
import AuthenticatedRequest from "../../middlewares/authMiddleware.ts";

// Create a new exam
// Create a new exam
export const createExam = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      title,
      startTime,
      endTime,
      course,
      batch,
      numQuestions,
      k,
      maxMarks,
      reminderSchedule,
    } = req.body;

    if (!req.user?._id) {
      res.status(401).json({ message: "Unauthorized: no user ID in token" });
      return;
    }

    if (reminderSchedule && Array.isArray(reminderSchedule)) {
      const firstReminder = reminderSchedule[0];
      if (firstReminder.sendTime && new Date(firstReminder.sendTime) > new Date(startTime)) {
        res.status(400).json({ message: "Reminder send time must be on or before the exam start time" });
        return;
      }
    }

    const exam = new Exam({
      title,
      startTime,
      endTime,
      course,
      batch,
      numQuestions,
      k,
      maxMarks,
      reminderSchedule: Array.isArray(reminderSchedule)
        ? reminderSchedule.map((item: any) => ({
          type: item.type || 'preExam',
          offsetHours: item.offsetHours || 1,
          sendTime: item.sendTime ? new Date(item.sendTime) : undefined,
          sentAt: null,
        }))
        : [],
      createdBy: req.user._id,
    });

    await exam.save();

    res
      .status(201)
      .json({ message: "Exam created successfully", examId: exam._id });
  } catch (error) {
    next(error);
  }
};


// Get a single exam
export const getSingleExam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId)
      .populate("course", "name code")
      .populate("batch", "name");

    if (!exam) {
      res.status(404).json({ error: "Exam not found" });
      return;
    }

    res.json({ exam }); // includes 'k' since it's in the model
  } catch (error) {
    next(error);
  }
};

// Update exam
export const updateExam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { examId } = req.params;
    const updates = {
      ...req.body,
      reminderSchedule: Array.isArray(req.body.reminderSchedule)
        ? req.body.reminderSchedule.map((item: any) => ({
          type: item.type || 'preExam',
          offsetHours: item.offsetHours || 1,
          sendTime: item.sendTime ? new Date(item.sendTime) : undefined,
          sentAt: item.sentAt || null,
        }))
        : undefined,
    };
    const exam = await Exam.findByIdAndUpdate(examId, updates, { new: true });

    if (!exam) {
      res.status(404).json({ error: "Exam not found" });
      return;
    }

    res.json({ message: "Exam updated successfully", examId: exam._id });
  } catch (error) {
    next(error);
  }
};

// Delete exam
export const deleteExam = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { examId } = req.params;
    const deleted = await Exam.findByIdAndDelete(examId);

    if (!deleted) {
      res.status(404).json({ error: "Exam not found" });
      return;
    }

    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get all submissions for an exam
export const getExamSubmissions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { examId } = req.params;
    const submissions = await Submission.find({ exam: examId })
      .populate("student", "name email")
      .populate("exam", "title");

    res.json({ submissions });
  } catch (error) {
    next(error);
  }
};

// Add answer key to an exam
export const uploadAnswerKey = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const examId = req.params.examId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }

    exam.answerKeyPdf = file.buffer;
    exam.answerKeyMimeType = file.mimetype;

    await exam.save();

    res.status(200).json({ message: "Answer key uploaded successfully" });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// get all exams for a teacher
export const getAllExamsForTeacher = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teacherId = req.user?._id;

    if (!teacherId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const batches = await Batch.find({
      instructor: teacherId,
    }).select("_id");

    const batchIds = batches.map((b) => b._id);

    // Find all exams under these batches
    const exams = await Exam.find({
      batch: { $in: batchIds },
    })
      .populate("batch", "name")
      .sort({ startTime: -1 });
    res.json({ exams });
  } catch (err) {
    console.error("Failed to fetch exams:", err);
    next(err);
  }
};

//upload question paper
export const uploadQuestionPaper = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const examId = req.params.examId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404).json({ message: "Exam not found" });
      return;
    }

    exam.questionPaperPdf = file.buffer;
    exam.questionPaperMimeType = file.mimetype;
    await exam.save();
    res.status(200).json({ message: "Question paper uploaded successfully" });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
