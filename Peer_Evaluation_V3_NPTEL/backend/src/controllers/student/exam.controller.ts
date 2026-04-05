import { Request, Response, NextFunction } from "express";
import { Exam } from "../../models/Exam.ts";
import { Batch } from "../../models/Batch.ts";
import { User } from "../../models/User.ts";

interface AuthRequest extends Request {
  user?: any;
}

export const 
getStudentExamsByCourse = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params; // or req.query if you prefer

    if (!courseId) {
      res.status(400).json({ error: "courseId is required" });
      return;
    }

    const student = await User.findById(studentId);
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const studentBatches = await Batch.find({
      students: student._id,
      course: courseId,
    });

    const batchIds = studentBatches.map((b) => b._id);

    const now = new Date();

    const exams = await Exam.find({
      course: courseId,
      batch: { $in: batchIds },
      endTime: { $gte: now },
    })
      .populate("course", "name code")
      .populate("batch", "name");

    res.status(200).json({ exams });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

export const getStudentExams = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentId = (req as any).user.id;

    const student = await User.findById(studentId);
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    const enrolledCourseIds = student.enrolledCourses;
    const batches = await Batch.find({ students: student._id });
    const batchIds = batches.map((b) => b._id);

    const now = new Date();
    const exams = await Exam.find({
      course: { $in: enrolledCourseIds },
      batch: { $in: batchIds },
      endTime: { $gte: now },
    })
      .populate("course", "name code")
      .populate("batch", "name");

    res.json({ exams });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
