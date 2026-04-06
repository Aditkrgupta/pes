import { useState, useEffect } from "react";
import axios from "axios";

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

const TeacherAnalytics = () => {
    const [analytics, setAnalytics] = useState<any>(null);
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
            .get(`http://localhost:${PORT}/api/teacher/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setAnalytics(res.data))
            .catch((err) => {
                setError(err.response?.data?.message || "Unable to load teacher analytics.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-16 text-gray-600">Loading analytics...</div>;
    if (error) return <div className="text-center py-16 text-red-600">{error}</div>;

    const topStudents = analytics.studentSummaries
        ? [...analytics.studentSummaries].sort((a: any, b: any) => b.average - a.average).slice(0, 5)
        : [];
    const riskCount = analytics.earlyWarnings?.length ?? 0;
    const totalStudents = analytics.studentSummaries?.length ?? 0;
    const maxAvg = Math.max(...topStudents.map((item: any) => item.average), 100);
    const trendLabel = analytics.classTrend ? analytics.classTrend.toUpperCase() : "STABLE";

    return (
        <div className="space-y-8 w-full max-w-6xl mx-auto py-10">
            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h1 className="text-3xl font-bold text-purple-950">Teacher Analytics</h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                    Quick insights into class performance, score patterns, and student risk signals. Use this overview to identify students who need support and track whether the class is improving on recent exam cycles.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Class Trend</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{trendLabel}</p>
                    <p className="mt-2 text-sm text-gray-500">Shows whether average scores are improving, stable, or declining.</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Exams analyzed</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{analytics.examCount ?? 0}</p>
                    <p className="mt-2 text-sm text-gray-500">Total exams included in this analytics report.</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">At-risk students</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{riskCount}</p>
                    <p className="mt-2 text-sm text-gray-500">Students flagged for score drops needing extra attention.</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase tracking-wide text-purple-600 font-semibold">Students analyzed</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{totalStudents}</p>
                    <p className="mt-2 text-sm text-gray-500">Student records used to generate this dashboard.</p>
                </div>
            </div>

            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-purple-900">Top student averages</h2>
                        <p className="mt-2 text-gray-600 max-w-2xl">
                            A quick look at the highest average performers in the current dataset. This helps identify strong performers and benchmark the rest of the class.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700">
                        {topStudents.length} top students by average score
                    </div>
                </div>
                <div className="mt-6 space-y-4">
                    {topStudents.map((student: any) => (
                        <div key={student.studentId} className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>{student.name}</span>
                                <span className="font-semibold text-purple-900">{student.average}</span>
                            </div>
                            <div className="h-3 rounded-full bg-purple-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                                    style={{ width: `${Math.min(100, (student.average / maxAvg) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">Student performance summary</h2>
                {analytics.studentSummaries?.length ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-sm uppercase text-gray-500">
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Avg score</th>
                                    <th className="px-4 py-3">Performance trend</th>
                                    <th className="px-4 py-3">Peer evaluations</th>
                                    <th className="px-4 py-3">Early risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.studentSummaries.map((student: any) => (
                                    <tr key={student.studentId} className="bg-purple-50/80 rounded-xl">
                                        <td className="px-4 py-4 font-semibold text-purple-900">{student.name}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <span>{student.average}</span>
                                                <div className="flex-1 h-2 rounded-full bg-purple-100">
                                                    <div
                                                        className="h-full rounded-full bg-purple-600"
                                                        style={{ width: `${Math.min(100, (student.average / Math.max(100, maxAvg)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 capitalize">{student.trend}</td>
                                        <td className="px-4 py-4">{student.peerEvaluationsCompleted}</td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${student.earlyWarning ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {student.earlyWarning ? 'At risk' : 'Healthy'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No student analytics data available yet.</p>
                )}
            </div>
        </div>
    );
};

export default TeacherAnalytics;
