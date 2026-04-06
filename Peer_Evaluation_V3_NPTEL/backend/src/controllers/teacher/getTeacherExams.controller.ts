import { Response } from "express";
import { Exam } from "../../models/Exam.ts";
import { Batch } from "../../models/Batch.ts";
import { Course } from "../../models/Course.ts";
import AuthenticatedRequest from "../../middlewares/authMiddleware.ts";

export const getTeacherExams = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const teacherId = req.user._id;

    const exams = await Exam.find({ createdBy: teacherId });

    const result = await Promise.all(
      exams.map(async (exam) => {
        const batch = await Batch.findById(exam.batch);
        const course = await Course.findById(exam.course);
        return {
          _id: exam._id,
          title: exam.title,
          course: course ? course.name : "",
          batch: batch ? batch.name : "",
          startTime: exam.startTime,
          endTime: exam.endTime,
          numQuestions: exam.numQuestions,
          k: exam.k,
          maxMarks: exam.maxMarks,
        };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch exams" });
  }
};