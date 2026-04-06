import { useState, useEffect } from "react";
import axios from "axios";

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

const AdminAuditLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
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
            .get(`http://localhost:${PORT}/api/admin/audit-logs`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setLogs(res.data.logs || []))
            .catch((err) => setError(err.response?.data?.message || "Unable to load audit logs."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-16 text-gray-600">Loading audit logs...</div>;
    if (error) return <div className="text-center py-16 text-red-600">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto py-10 space-y-8">
            <div className="rounded-3xl bg-white border border-purple-200 p-6 shadow-sm">
                <h2 className="text-2xl font-semibold text-purple-900 mb-4">Audit trail</h2>
                {logs.length ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-sm uppercase text-gray-500">
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log._id} className="bg-purple-50/80 rounded-xl">
                                        <td className="px-4 py-4 text-sm text-gray-600">{new Date(log.createdAt).toLocaleString()}</td>
                                        <td className="px-4 py-4 text-sm text-purple-900">
                                            {log.user?.name || "Unknown"} ({log.user?.email || log.user?._id || "n/a"})
                                        </td>
                                        <td className="px-4 py-4 text-sm">{log.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No audit entries found.</p>
                )}
            </div>
        </div>
    );
};

export default AdminAuditLogs;
