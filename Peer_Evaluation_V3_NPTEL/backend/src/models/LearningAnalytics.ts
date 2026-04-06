import { Schema, model, Document, Types } from "mongoose";

export interface ILearningAnalytics extends Document {
    student: Types.ObjectId;
    course?: Types.ObjectId;
    latestExam?: Types.ObjectId;
    classAverage: number;
    studentAverage: number;
    trend: string;
    peerEvaluationSkill: number;
    peerEvaluationCount: number;
    earlyWarning: boolean;
    details: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const learningAnalyticsSchema = new Schema<ILearningAnalytics>(
    {
        student: { type: Schema.Types.ObjectId, ref: "User", required: true },
        course: { type: Schema.Types.ObjectId, ref: "Course" },
        latestExam: { type: Schema.Types.ObjectId, ref: "Exam" },
        classAverage: { type: Number, default: 0 },
        studentAverage: { type: Number, default: 0 },
        trend: { type: String, default: "stable" },
        peerEvaluationSkill: { type: Number, default: 0 },
        peerEvaluationCount: { type: Number, default: 0 },
        earlyWarning: { type: Boolean, default: false },
        details: { type: Schema.Types.Mixed, default: {} },
    },
    {
        timestamps: true,
    }
);

export const LearningAnalytics = model<ILearningAnalytics>(
    "LearningAnalytics",
    learningAnalyticsSchema
);
