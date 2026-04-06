// frontend/src/components/teacher/TeacherResolvedTickets.tsx
import { useEffect, useState } from "react";
import axios from "axios";

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  remark?: string;
  student?: { name?: string };
  ta?: { name?: string };
  resolvedAt?: string;
}

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const TeacherResolvedTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResolvedTickets = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/teacher/resolved-tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setTickets(data.data || []);
    } catch (err) {
      console.error("Failed to fetch resolved tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolvedTickets();
  }, []);

  if (loading) return <p className="p-4">Loading resolved tickets...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Resolved Tickets History</h2>
      {tickets.length === 0 ? (
        <p>No resolved tickets found.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li
              key={ticket._id}
              className="border border-gray-300 rounded-md p-4 shadow-md"
            >
              <h3 className="text-lg font-bold">{ticket.subject}</h3>
              <p>{ticket.description}</p>
              <p><strong>Remark:</strong> {ticket.remark || "No remark provided"}</p>
              <p><strong>Student:</strong> {ticket.student?.name || "N/A"}</p>
              <p><strong>TA:</strong> {ticket.ta?.name || "N/A"}</p>
              <p><strong>Resolved At:</strong> {ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleString() : "N/A"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherResolvedTickets;
