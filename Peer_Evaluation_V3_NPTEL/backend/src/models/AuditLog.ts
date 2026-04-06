import { Schema, model, Document, Types } from "mongoose";

export interface IAuditLog extends Document {
    user: Types.ObjectId;
    role: string;
    action: string;
    resourceType: string;
    resourceId?: Types.ObjectId | string;
    route: string;
    method: string;
    details?: Record<string, any>;
    ip?: string;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: { type: String, required: true },
        action: { type: String, required: true },
        resourceType: { type: String, required: true },
        resourceId: { type: Schema.Types.ObjectId, default: null },
        route: { type: String, required: true },
        method: { type: String, required: true },
        details: { type: Schema.Types.Mixed },
        ip: { type: String },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ user: 1, resourceType: 1, createdAt: -1 });

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);
