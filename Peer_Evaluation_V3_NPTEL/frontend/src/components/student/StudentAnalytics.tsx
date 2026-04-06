import { useState, useEffect } from "react";
import axios from "axios";

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

const StudentAnalytics = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Missing authentication token.");
            setLoading(false);
            return;
        }

        axios
            .get(`http://localhost:${PORT}/api/student/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setData(res.data))
            .catch((err) => setError(err.response?.data?.message || "Unable to load analytics."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-16 text-gray-600">Loading analytics...</div>;
    if (error) return <div className="text-center py-16 text-red-600">{error}</div>;

    const history = data.evaluationHistory || [];
    const maxScore = Math.max(100, ...history.map((item: any) => item.score));
    const lastScore = history.length ? history[history.length - 1].score : 0;
    const gapText = data.trend === "improving" ? "Your performance is trending upward." : data.trend === "declining" ? "Your latest score fell compared to the previous exam." : "Your performance is stable.";

    return (
        <div className="max-w-6xl mx-auto py-10 space-y-8">
            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h1 className="text-3xl font-bold text-purple-950">Student Analytics</h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                    See your latest assessment results, track your progress, and understand what the numbers mean for your learning journey.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Current average</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{data.studentAverage ?? 0}</p>
                    <p className="mt-2 text-sm text-gray-500">Your average score across completed peer evaluations.</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Trend</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900 capitalize">{data.trend || "stable"}</p>
                    <p className="mt-2 text-sm text-gray-500">Whether your scores are improving, stable, or need attention.</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Exams scored</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{data.examCount ?? 0}</p>
                    <p className="mt-2 text-sm text-gray-500">Number of exams evaluated so far.</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Peer reviews</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{data.peerEvaluationsCompleted ?? 0}</p>
                    <p className="mt-2 text-sm text-gray-500">Peer evaluations you have completed as an evaluator.</p>
                </div>
            </div>

            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-purple-900">Score progress chart</h2>
                        <p className="mt-2 text-gray-600 max-w-2xl">
                            Visualize your last assessment scores to see how your performance is changing over time.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700">
                        Last exam: {history.length ? lastScore : "N/A"}
                    </div>
                </div>
                {history.length ? (
                    <div className="mt-6 space-y-3">
                        {history.map((item: any, index: number) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>{item.examTitle}</span>
                                    <span className="font-semibold text-purple-900">{item.score}</span>
                                </div>
                                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                                        style={{ width: `${Math.min(100, (item.score / maxScore) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No score history is available yet. Complete an exam and peer review to start tracking progress.</p>
                )}
            </div>

            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">What this means</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-purple-50 p-5">
                        <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Trend explained</p>
                        <p className="mt-2 text-sm text-gray-700">{gapText}</p>
                    </div>
                    <div className="rounded-3xl bg-purple-50 p-5">
                        <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Stable score</p>
                        <p className="mt-2 text-sm text-gray-700">A stable trend means your latest score is within 5 points of the previous one.</p>
                    </div>
                    <div className="rounded-3xl bg-purple-50 p-5">
                        <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Next step</p>
                        <p className="mt-2 text-sm text-gray-700">If you see a decline, review feedback and focus on the next exam to improve.</p>
                    </div>
                </div>
            </div>

            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">Assessment history</h2>
                {history.length ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-sm uppercase text-gray-500">
                                    <th className="px-4 py-3">Exam</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Score</th>
                                    <th className="px-4 py-3">Evaluator</th>
                                    <th className="px-4 py-3">Feedback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((item: any, index: number) => (
                                    <tr key={index} className="bg-purple-50/80 rounded-xl">
                                        <td className="px-4 py-4 font-semibold text-purple-900">{item.examTitle}</td>
                                        <td className="px-4 py-4">{new Date(item.date).toLocaleString()}</td>
                                        <td className="px-4 py-4">{item.score}</td>
                                        <td className="px-4 py-4">{item.evaluatorName}</td>
                                        <td className="px-4 py-4">{item.feedback || "No feedback"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No assessment history is available yet.</p>
                )}
            </div>
        </div>
    );
};

export default StudentAnalytics;
