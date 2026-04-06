import { Schema, model, Document, Types } from "mongoose";

export interface IExam extends Document {
  title: string;
  course: Types.ObjectId;
  batch: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  numQuestions: number;
  maxMarks: number[];
  createdBy: { type: Schema.Types.ObjectId; ref: "User"; required: true };
  k: number; // Number of peer evaluations per student
  peerEvaluationInitiated?: boolean; // Whether teacher has initiated peer evaluation
  peerEvaluationInitiatedAt?: Date; // When peer evaluation was initiated
  reminderSchedule?: {
    type: 'preExam' | 'evaluationWindow';
    offsetHours: number;
    sendTime?: Date;
    sentAt: Date | null;
  }[];
  answerKeyPdf?: Buffer;
  answerKeyMimeType?: string;
  questionPaperPdf?: Buffer;
  questionPaperMimeType?: string;
}

const examSchema = new Schema<IExam>({
  title: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  batch: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  numQuestions: { type: Number, required: true },
  maxMarks: { type: [Number], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  k: { type: Number, required: true },
  peerEvaluationInitiated: { type: Boolean, default: false },
  peerEvaluationInitiatedAt: { type: Date, default: null },
  reminderSchedule: [
    {
      type: { type: String, enum: ['preExam', 'evaluationWindow'], required: true, default: 'preExam' },
      offsetHours: { type: Number, default: 1 },
      sendTime: { type: Date },
      sentAt: { type: Date, default: null },
    },
  ],
  answerKeyPdf: { type: Buffer },
  answerKeyMimeType: { type: String },
  questionPaperPdf: { type: Buffer },
  questionPaperMimeType: { type: String },
});

export const Exam = model<IExam>("Exam", examSchema);
