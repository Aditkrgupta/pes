import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User.ts';
import { Course } from '../../models/Course.ts';

export const getAllTeachers = async (_req: Request, res: Response) => {
    try {
        const teachers = await User.find({ role: 'teacher' }).populate('enrolledCourses', 'name code');
        res.status(200).json(teachers);
    } catch (err) {
        console.error('Failed to fetch teachers', err);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
};

export const deleteTeacher = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        const deleted = await User.findOneAndDelete({ email, role: 'teacher' });
        if (!deleted) return res.status(404).json({ error: 'Teacher not found' });
        res.status(200).json({ message: 'Teacher deleted successfully' });
    } catch (err) {
        console.error('Failed to delete teacher', err);
        res.status(500).json({ error: 'Failed to delete teacher' });
    }
};

export const assignTeacherToCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, courseCode } = req.body;
        const teacher = await User.findOne({ email, role: 'teacher' });
        if (!teacher) return void res.status(404).json({ message: 'Teacher not found' });

        const course = await Course.findOne({ code: courseCode });
        if (!course) return void res.status(404).json({ message: 'Course not found' });

        const courseId = new mongoose.Types.ObjectId(course._id as string);
        const alreadyAssigned = teacher.enrolledCourses.some((id) => new mongoose.Types.ObjectId(id).equals(courseId));

        if (!alreadyAssigned) {
            teacher.enrolledCourses.push(courseId);
            await teacher.save();
        }

        res.status(200).json({ message: 'Teacher assigned to course successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to assign teacher to course', details: error.message });
    }
};

export const unassignTeacherFromCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, courseCode } = req.body;
        const teacher = await User.findOne({ email, role: 'teacher' });
        if (!teacher) return void res.status(404).json({ message: 'Teacher not found' });

        const course = await Course.findOne({ code: courseCode });
        if (!course) return void res.status(404).json({ message: 'Course not found' });

        const courseId = new mongoose.Types.ObjectId(course._id as string);
        teacher.enrolledCourses = teacher.enrolledCourses.filter(
            (id) => !new mongoose.Types.ObjectId(id).equals(courseId)
        );

        await teacher.save();
        res.status(200).json({ message: 'Teacher unassigned from course successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: 'Failed to unassign teacher from course', details: error.message });
    }
};
