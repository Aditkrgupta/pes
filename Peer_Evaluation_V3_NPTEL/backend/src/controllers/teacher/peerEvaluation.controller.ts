import { Response } from "express";
import { Exam } from "../../models/Exam.ts";
import { Batch } from "../../models/Batch.ts";
import { Submission } from "../../models/Submission.ts";
import { Evaluation } from "../../models/Evaluation.ts";
import { sendBatchReminderEmails } from "../../utils/sendEmailReminder.ts";
import AuthenticatedRequest from "../../middlewares/authMiddleware.ts";
import { assignEvaluationsFlow } from "../../utils/assignEvaluationsFlow.ts";

export const initiatePeerEvaluation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    const { examId } = req.body;

    if (!teacherId || req.user.role !== "teacher") {
      res.status(403).json({ message: "Only teachers can initiate evaluation." });
      return;
    }

    const exam = await Exam.findById(examId).select("batch k");
    if (!exam) {
      res.status(404).json({ message: "Exam not found." });
      return;
    }

    const batch = await Batch.findById(exam.batch).select("instructor");
    if (!batch) {
      res.status(404).json({ message: "Batch not found." });
      return;
    }

    if (batch.instructor.toString() !== teacherId.toString()) {
      res.status(403).json({ message: "You are not the instructor for this batch." });
      return;
    }

    const submissions = await Submission.find({ exam: examId });
    const submittedStudents = submissions.map((sub) => sub.student.toString());
    const k = exam.k;
    const n = submittedStudents.length;

    if (typeof k !== "number" || k < 1 || k >= n) {
      res.status(400).json({
        message: "k must be a positive integer less than number of submitted students.",
      });
      return;
    }

    const [success, pairs] = assignEvaluationsFlow(submittedStudents, k);
    if (!success) {
      res.status(400).json({
        message: `Unable to assign ${k} evaluations per student. Possibly due to too few submissions.`,
      });
      return;
    }

    await Evaluation.deleteMany({ exam: examId });

    const evalsToInsert = pairs.map(([evaluator, evaluatee]) => ({
      exam: examId,
      evaluator,
      evaluatee,
      marks: [],
      feedback: '',
      status: 'pending',
      flagged: false,
    }));

    await Evaluation.insertMany(evalsToInsert);

    // Mark the exam as having peer evaluation initiated
    await Exam.findByIdAndUpdate(examId, {
      peerEvaluationInitiated: true,
      peerEvaluationInitiatedAt: new Date(),
    });

    const emailSubject = "📢 Peer Evaluation Round Started";
    const emailBody = `Hi {{name}},\n\nYou have been assigned peer evaluations for your recent exam.\n\nPlease visit the PES portal and complete your assigned evaluations at the earliest.\n\nThank you,\nPES Team`;

    await sendBatchReminderEmails(
      exam.batch.toString(),
      emailSubject,
      emailBody
    );

    // ✅ Receipt: evaluator → list of assigned evaluatees
    const receipt: Record<string, string[]> = {};
    for (const [evaluator, evaluatee] of pairs) {
      if (!receipt[evaluator]) receipt[evaluator] = [];
      receipt[evaluator].push(evaluatee);
    }

    res.status(200).json({
      message: "Peer evaluation initiated with guaranteed balanced assignments.",
      totalEvaluations: evalsToInsert.length,
      receipt,
    });
    return;
  } catch (err) {
    console.error("Error initiating peer evaluation:", err);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
