import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Batch } from "../../models/Batch.ts";
import { Exam } from "../../models/Exam.ts";
import { Evaluation } from "../../models/Evaluation.ts";
import { User } from "../../models/User.ts";
import { LearningAnalytics } from "../../models/LearningAnalytics.ts";

const computeScore = (marks: number[]) => marks.reduce((sum, mark) => sum + mark, 0);
const computeTrend = (values: number[]) => {
    if (values.length < 2) return "stable";
    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    const delta = last - prev;
    if (delta >= 5) return "improving";
    if (delta <= -5) return "declining";
    return "stable";
};

const calculateAnalyticsSnapshot = async (studentId: Types.ObjectId, evaluations: any[], classAverages: Record<string, number>) => {
    const examsGrouped: Record<string, any> = {};
    evaluations.forEach((ev) => {
        const examId = ev.exam.toString();
        const score = computeScore(ev.marks);
        if (!examsGrouped[examId]) {
            examsGrouped[examId] = {
                exam: ev.exam,
                examTitle: ev.examTitle,
                examDate: ev.examDate,
                scores: [],
            };
        }
        examsGrouped[examId].scores.push(score);
    });

    const history = Object.values(examsGrouped).map((group: any) => ({
        exam: group.exam,
        examTitle: group.examTitle,
        examDate: group.examDate,
        score: Math.round(group.scores.reduce((a: number, b: number) => a + b, 0) / group.scores.length),
        classAverage: classAverages[group.exam.toString()] || 0,
    }));

    const studentScores = history.map((item: any) => item.score);
    const studentAverage = studentScores.length ? Math.round(studentScores.reduce((a: number, b: number) => a + b, 0) / studentScores.length) : 0;
    const peerEvalCount = evaluations.filter((ev) => ev.evaluator?.toString() === studentId.toString()).length;
    const peerSkill = evaluations.length ? Math.round(peerEvalCount * 10) : 0;

    const latestExam = history.sort((a: any, b: any) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime())[0];
    const trend = computeTrend(studentScores);
    const earlyWarning = studentScores.length >= 2 && studentScores[studentScores.length - 1] < studentScores[studentScores.length - 2] - 5;

    return {
        student: studentId,
        latestExam: latestExam?.exam,
        classAverage: history.length ? Math.round(history.reduce((acc: number, item: any) => acc + item.classAverage, 0) / history.length) : 0,
        studentAverage,
        trend,
        peerEvaluationSkill: peerSkill,
        peerEvaluationCount: peerEvalCount,
        earlyWarning,
        details: {
            history,
        },
    };
};

export const getTeacherLearningAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const teacherId = (req as any).user._id;
        const batches = await Batch.find({ instructor: teacherId }).select("_id");
        const batchIds = batches.map((batch) => batch._id);
        const exams = await Exam.find({ batch: { $in: batchIds } }).populate("course", "name").populate("batch", "name");
        const examIds = exams.map((exam) => exam._id);

        const allEvaluations: any[] = await Evaluation.find({ exam: { $in: examIds }, status: "completed" })
            .populate("exam", "title startTime")
            .populate("evaluatee", "name email")
            .populate("evaluator", "name");

        const classAverages: Record<string, number> = {};
        const examGroups: Record<string, number[]> = {};

        allEvaluations.forEach((ev) => {
            const examId = ev.exam._id.toString();
            const score = computeScore(ev.marks);
            examGroups[examId] = examGroups[examId] || [];
            examGroups[examId].push(score);
        });
        Object.entries(examGroups).forEach(([examId, scores]) => {
            classAverages[examId] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        });

        const studentMap: Record<string, any> = {};
        const evaluatorCounts: Record<string, number> = {};

        for (const ev of allEvaluations) {
            const studentId = ev.evaluatee._id.toString();
            const evaluatorId = ev.evaluator?._id?.toString();

            studentMap[studentId] = studentMap[studentId] || {
                studentId: ev.evaluatee._id,
                studentName: ev.evaluatee.name,
                exams: [],
            };
            studentMap[studentId].exams.push({
                examId: ev.exam._id,
                title: ev.exam.title,
                date: ev.exam.startTime,
                score: computeScore(ev.marks),
                classAverage: classAverages[ev.exam._id.toString()] || 0,
            });

            if (evaluatorId) {
                evaluatorCounts[evaluatorId] = (evaluatorCounts[evaluatorId] || 0) + 1;
            }
        }

        const studentSummaries = Object.values(studentMap).map((student: any) => {
            const evaluatorCount = evaluatorCounts[student.studentId.toString()] || 0;
            const scores = student.exams.map((exam: any) => exam.score);
            const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
            const trend = computeTrend(scores);
            const earlyWarning = scores.length >= 2 && scores[scores.length - 1] < scores[scores.length - 2] - 5;
            return {
                studentId: student.studentId,
                name: student.studentName,
                trend,
                earlyWarning,
                scoreHistory: student.exams.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
                average: avg,
                peerEvaluationsCompleted: evaluatorCount,
                peerEvalSkillDevelopment: evaluatorCount,
            };
        });

        const classTrendValues = exams.map((exam: any) => classAverages[exam._id?.toString() || ""] || 0);
        const classTrend = computeTrend(classTrendValues);

        const analyticsSnapshotPromises = Object.values(studentMap).map(async (student: any) => {
            const studentEvaluations = allEvaluations.filter((ev) => ev.evaluatee._id.toString() === student.studentId.toString());
            const snapshot = calculateAnalyticsSnapshot(student.studentId, studentEvaluations, classAverages);
            return LearningAnalytics.findOneAndUpdate(
                { student: student.studentId },
                snapshot,
                { upsert: true, new: true }
            );
        });

        await Promise.all(analyticsSnapshotPromises);

        res.json({
            classTrend,
            studentSummaries,
            examCount: exams.length,
            earlyWarnings: studentSummaries.filter((item: any) => item.earlyWarning),
        });
    } catch (err) {
        next(err);
    }
};

export const getStudentLearningAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const studentId = (req as any).user._id;
        const enrollments = await Batch.find({ students: studentId }).select("_id");
        const batchIds = enrollments.map((batch) => batch._id);
        const exams = await Exam.find({ batch: { $in: batchIds } });
        const examIds = exams.map((exam) => exam._id);
        const evaluations: any[] = await Evaluation.find({ evaluatee: studentId, status: "completed" })
            .populate("exam", "title startTime")
            .populate("evaluator", "name");

        const evaluationHistory = evaluations.map((ev: any) => ({
            examTitle: ev.exam.title,
            date: ev.exam.startTime,
            score: computeScore(ev.marks),
            evaluatorName: ev.evaluator?.name || "Peer",
            feedback: ev.feedback,
        })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const scores = evaluationHistory.map((entry) => entry.score);
        const trend = computeTrend(scores);
        const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const earlyWarning = scores.length >= 2 && scores[scores.length - 1] < scores[scores.length - 2] - 5;

        const evaluatorCount = await Evaluation.countDocuments({ evaluator: studentId, status: "completed" });

        const existingSnapshot = await LearningAnalytics.findOne({ student: studentId });
        if (existingSnapshot) {
            existingSnapshot.studentAverage = averageScore;
            existingSnapshot.trend = trend;
            existingSnapshot.earlyWarning = earlyWarning;
            existingSnapshot.details = { evaluationHistory, examCount: exams.length };
            existingSnapshot.peerEvaluationCount = evaluatorCount;
            await existingSnapshot.save();
        }

        res.json({
            studentAverage: averageScore,
            trend,
            examCount: exams.length,
            earlyWarning,
            evaluationHistory,
            peerEvaluationsCompleted: evaluatorCount,
            snapshot: existingSnapshot,
        });
    } catch (err) {
        next(err);
    }
};

export const getAdminLearningAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalSnapshots = await LearningAnalytics.countDocuments();
        const earlyWarnings = await LearningAnalytics.countDocuments({ earlyWarning: true });
        const averageStudentScore = await LearningAnalytics.aggregate([
            { $group: { _id: null, avgScore: { $avg: "$studentAverage" } } },
        ]);
        const topRisks = await LearningAnalytics.find({ earlyWarning: true }).sort({ studentAverage: 1 }).limit(10).populate("student", "name email");

        res.json({
            totalSnapshots,
            earlyWarnings,
            averageStudentScore: averageStudentScore[0]?.avgScore || 0,
            topRisks: topRisks.map((entry) => ({
                student: entry.student,
                studentAverage: entry.studentAverage,
                trend: entry.trend,
            })),
        });
    } catch (err) {
        next(err);
    }
};
