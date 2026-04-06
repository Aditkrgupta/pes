import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User.ts';
import { Course } from '../../models/Course.ts';

export const getAllStudents = async (_req: Request, res: Response) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email role enrolledCourses');
    res.status(200).json(students);
  } catch (error) {
    console.error('Failed to fetch students', error);
    res.status(500).json({ message: 'Failed to fetch students', error });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const deletedStudent = await User.findOneAndDelete({ email, role: 'student' });
    if (!deletedStudent) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Failed to delete student', error);
    res.status(500).json({ message: 'Failed to delete student', error });
  }
};

export const assignStudentToCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, courseCode } = req.body;
    const student = await User.findOne({ email, role: 'student' });
    if (!student) return void res.status(404).json({ message: 'Student not found' });

    const course = await Course.findOne({ code: courseCode });
    if (!course) return void res.status(404).json({ message: 'Course not found' });

    const courseId = new mongoose.Types.ObjectId(course._id as string);
    const alreadyEnrolled = student.enrolledCourses.some((id) => new mongoose.Types.ObjectId(id).equals(courseId));

    if (!alreadyEnrolled) {
      student.enrolledCourses.push(courseId);
      await student.save();
    }

    res.status(200).json({ message: 'Student assigned to course successfully' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to assign student to course', details: err.message });
  }
};

export const unassignStudentFromCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, courseCode } = req.body;
    const student = await User.findOne({ email, role: 'student' });
    if (!student) return void res.status(404).json({ message: 'Student not found' });

    const course = await Course.findOne({ code: courseCode });
    if (!course) return void res.status(404).json({ message: 'Course not found' });

    const courseId = new mongoose.Types.ObjectId(course._id as string);
    student.enrolledCourses = student.enrolledCourses.filter(
      (id) => !new mongoose.Types.ObjectId(id).equals(courseId)
    );

    await student.save();
    res.status(200).json({ message: 'Student unassigned from course successfully' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unassign student from course', details: err.message });
  }
};
