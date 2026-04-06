import jwt from "jsonwebtoken";

const PDF_SECRET = process.env.JWT_SECRET || "fallbacksecret";

export const generatePdfToken = (userId: string, examId: string): string => {
  return jwt.sign(
    { userId, examId },
    PDF_SECRET,
    { expiresIn: "10m" } 
  );
};
