import { Request, Response, NextFunction } from "express";
import { AuditLog } from "../models/AuditLog.ts";

export type ResourceIdFn = (req: Request) => string | null;

export const auditLogger = (action: string, resourceType: string, resourceIdFn?: ResourceIdFn) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const startTime = new Date();
        res.on("finish", async () => {
            try {
                const user = (req as any).user;
                if (!user) return;

                const resourceId = resourceIdFn ? resourceIdFn(req) : req.params.id || req.params.examId || req.body.examId || req.params.evaluationId || req.body.evaluationId || null;

                await AuditLog.create({
                    user: user._id,
                    role: user.role,
                    action,
                    resourceType,
                    resourceId,
                    route: req.originalUrl,
                    method: req.method,
                    details: {
                        params: req.params,
                        query: req.query,
                        body: { ...req.body, password: undefined },
                        statusCode: res.statusCode,
                        durationMs: Date.now() - startTime.getTime(),
                    },
                    ip: req.ip,
                });
            } catch (err) {
                console.error("Audit logging failed:", err);
            }
        });

        next();
    };
};
