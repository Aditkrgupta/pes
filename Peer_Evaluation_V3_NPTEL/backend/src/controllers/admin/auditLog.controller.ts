import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../../models/AuditLog.ts";

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logs = await AuditLog.find()
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .limit(200);

        res.json({ logs });
    } catch (err) {
        next(err);
    }
};
