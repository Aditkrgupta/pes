import { useState, useEffect } from "react";
import axios from "axios";

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

const AdminAnalytics = () => {
    const [metrics, setMetrics] = useState<any>(null);
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
            .get(`http://localhost:${PORT}/api/admin/analytics`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setMetrics(res.data))
            .catch((err) => setError(err.response?.data?.message || "Unable to load admin analytics."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-16 text-gray-600">Loading admin analytics...</div>;
    if (error) return <div className="text-center py-16 text-red-600">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto py-10 space-y-8">
            <div className="grid gap-6 md:grid-cols-4">
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase text-purple-600 font-semibold">Student snapshots</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{metrics.totalSnapshots ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase text-purple-600 font-semibold">Early warnings</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{metrics.earlyWarnings ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase text-purple-600 font-semibold">Average score</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{Math.round(metrics.averageStudentScore ?? 0)}</p>
                </div>
                <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm">
                    <p className="text-sm uppercase text-purple-600 font-semibold">At-risk students</p>
                    <p className="mt-3 text-3xl font-bold text-purple-900">{metrics.topRisks?.length ?? 0}</p>
                </div>
            </div>

            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">At-risk learners</h2>
                {metrics.topRisks?.length ? (
                    <div className="space-y-4">
                        {metrics.topRisks.map((item: any) => (
                            <div key={item.student._id} className="rounded-2xl border border-purple-100 bg-purple-50 p-4">
                                <p className="font-semibold text-purple-900">{item.student.name} ({item.student.email})</p>
                                <p className="text-sm text-gray-600">Average score: {item.studentAverage}</p>
                                <p className="text-sm text-gray-600">Trend: {item.trend}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No risk cases have been identified yet.</p>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;
