import { Request, Response, NextFunction } from 'express';
import { Evaluation } from '../../models/Evaluation.ts';
import { Exam } from '../../models/Exam.ts';
import { User } from '../../models/User.ts';
import { updateEvaluatorCredibilityIncremental } from '../../utils/credibilityScoring.js';

export const submitEvaluation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const evaluatorId = req.query.studentId as string;
    const { examId, evaluateeId, marks, feedback } = req.body;

    if (!evaluatorId || !examId || !evaluateeId || !marks) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      res.status(404).json({ error: 'Exam not found' });
      return;
    }

    if (!Array.isArray(marks) || marks.length !== exam.numQuestions) {
      res.status(400).json({
        error: `Expected ${exam.numQuestions} marks, but received ${marks.length}`,
      });
      return;
    }

    const existing = await Evaluation.findOne({
      exam: examId,
      evaluator: evaluatorId,
      evaluatee: evaluateeId,
    });

    if (existing) {
      res.status(400).json({ error: 'Evaluation already submitted' });
      return;
    }

    const evaluation = new Evaluation({
      exam: examId,
      evaluator: evaluatorId,
      evaluatee: evaluateeId,
      marks,
      feedback,
      status: 'completed',
    });

    await evaluation.save();

    // Update evaluator's credibility score incrementally
    const credibilityScore = await updateEvaluatorCredibilityIncremental(
      evaluatorId as any,
      examId as any,
      marks
    );

    // Update the evaluation with the credibility score and trust weight
    const trustWeight = 0.5 + credibilityScore;
    await Evaluation.findByIdAndUpdate(evaluation._id, {
      evaluatorCredibilityScore: credibilityScore,
      evaluatorTrustWeight: trustWeight,
    });

    await User.findByIdAndUpdate(evaluatorId, {
      $inc: { reputationScore: 1 },
    });

    res.status(201).json({ message: 'Evaluation submitted successfully' });
  } catch (err) {
    console.error(err);
    next(err);
  }
};
