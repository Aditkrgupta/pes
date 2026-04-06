import { Response } from "express";
import { Batch } from "../../models/Batch.ts";
import AuthenticatedRequest from "../../middlewares/authMiddleware.ts";

export const filterStudents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
   const {courseId,batch}=req.body

    if (!courseId || !batch) {
      res.status(400).json({ message: "Course and Batch required" });
      return;
    }


    const batchData = await Batch.findOne({
      _id: batch,
      course: courseId,
    })
      .populate("students", "name email")
      .populate("course", "name");

    if (!batchData) {
      res.status(404).json({ students: [] });
      return;
    }

    const students = batchData.students.map((s: any) => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      course: batchData.course._id,
      batch: batchData._id,
    }));

    res.status(200).json({ students });
  } catch (err) {
    console.error("Failed to fetch students:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};