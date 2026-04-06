import cron from "node-cron";
import { Exam } from "../models/Exam.ts";
import { Batch } from "../models/Batch.ts";
import { User } from "../models/User.ts";
import { Notification } from "../models/Notification.ts";
import { sendReminderEmail } from "./email.ts";

const isTimeDue = (target: Date) => {
    const now = new Date();
    return now >= target && now < new Date(target.getTime() + 15 * 60 * 1000);
};

const isOffsetDue = (target: Date, offsetHours: number) => {
    const now = new Date();
    const reminderTime = new Date(target.getTime() - offsetHours * 60 * 60 * 1000);
    return now >= reminderTime && now < new Date(reminderTime.getTime() + 15 * 60 * 1000);
};

const buildMessage = (examTitle: string, type: string, dueDate: Date) => {
    if (type === "preExam") {
        return `Reminder: Exam '${examTitle}' starts at ${dueDate.toLocaleString()}. Please review the instructions and submit on time.`;
    }
    if (type === "evaluationWindow") {
        return `Reminder: Peer evaluation window for '${examTitle}' opens soon at ${dueDate.toLocaleString()}. Please complete evaluations during the scheduled window.`;
    }
    return `Reminder for '${examTitle}'.`;
};

export const startNotificationScheduler = () => {
    cron.schedule("*/15 * * * *", async () => {
        try {
            const exams = await Exam.find({
                $or: [
                    { "reminderSchedule.0": { $exists: true } },
                ],
            }).populate("batch");

            for (const exam of exams) {
                const batchId = (exam.batch as any)?._id;
                const batch = batchId
                    ? await Batch.findById(batchId)
                        .populate("students")
                        .populate("instructor", "email name")
                    : null;
                const studentIds = batch?.students?.map((student: any) => student._id) || [];
                const recipients = await User.find({ _id: { $in: studentIds } });
                const instructor = batch?.instructor as any;
                const fromAddress = instructor?.email
                    ? `${instructor.name || "Teacher"} <${instructor.email}>`
                    : undefined;

                if (!exam.reminderSchedule || !Array.isArray(exam.reminderSchedule)) continue;

                for (const reminder of exam.reminderSchedule) {
                    if (reminder.sentAt) continue;
                    const targetTime = reminder.sendTime
                        ? new Date(reminder.sendTime)
                        : reminder.type === "preExam"
                            ? exam.startTime
                            : reminder.type === "evaluationWindow"
                                ? exam.startTime
                                : exam.startTime;

                    if (!targetTime) continue;

                    const shouldSend = reminder.sendTime
                        ? isTimeDue(targetTime)
                        : isOffsetDue(targetTime, reminder.offsetHours || 1);

                    if (shouldSend) {
                        const message = buildMessage(exam.title, reminder.type, targetTime);
                        for (const recipient of recipients) {
                            await Notification.create({
                                recipient: recipient._id,
                                message,
                                relatedResource: { type: "exam", id: exam._id },
                                read: false,
                            });
                            if (recipient.email) {
                                await sendReminderEmail(
                                    recipient.email,
                                    `Reminder: ${exam.title}`,
                                    message,
                                    fromAddress
                                ).catch((err) => console.error("Email reminder failed:", err));
                            }
                            reminder.sentAt = new Date();
                        }
                        await exam.save();
                    }
                }
            }
        } catch (err) {
            console.error("Notification scheduler error:", err);
        }
    });
};
