import { useEffect, useState } from "react";
import axios from "axios";

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  student?: { name?: string };
  ta?: { name?: string };
  resolved: boolean;
}

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const TeacherEscalatedTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const { data } = await axios.get(`${BASE_URL}/api/teacher/escalated-tickets`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (Array.isArray(data.data)) {
        setTickets(data.data);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error fetching tickets", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    const remark = remarks[ticketId];
    const marksUpdated = marks[ticketId];

    if (!remark?.trim()) {
      alert("Please enter a remark before resolving.");
      return;
    }

    try {
      setResolvingId(ticketId);
      await axios.put(
        `${BASE_URL}/api/teacher/resolve-ticket/${ticketId}`,
        {
          remark,
          marksUpdated: marksUpdated?.trim() === "" ? null : Number(marksUpdated),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setRemarks((prev) => ({ ...prev, [ticketId]: "" }));
      setMarks((prev) => ({ ...prev, [ticketId]: "" }));
      fetchTickets();
    } catch (error) {
      console.error("Error resolving ticket", error);
    } finally {
      setResolvingId(null);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  if (loading) return <p className="p-4">Loading escalated tickets...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Escalated Tickets</h2>
      {tickets.length === 0 ? (
        <p>No escalated tickets found.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li
              key={ticket._id}
              className="border border-gray-300 rounded-md p-4 shadow-md"
            >
              <h3 className="text-lg font-bold">{ticket.subject}</h3>
              <p>{ticket.description}</p>
              <p><strong>Student:</strong> {ticket.student?.name || "N/A"}</p>
              <p><strong>TA:</strong> {ticket.ta?.name || "N/A"}</p>
              <p><strong>Status:</strong> {ticket.resolved ? "Resolved ✅" : "Pending ❌"}</p>

              {!ticket.resolved && (
                <>
                  <textarea
                    className="w-full border mt-2 p-2 rounded"
                    placeholder="Enter remark for resolution..."
                    value={remarks[ticket._id] || ""}
                    onChange={(e) =>
                      setRemarks({ ...remarks, [ticket._id]: e.target.value })
                    }
                  />

                  <input
                    type="number"
                    className="w-full border mt-2 p-2 rounded"
                    placeholder="Enter updated marks (optional)"
                    value={marks[ticket._id] || ""}
                    onChange={(e) =>
                      setMarks({ ...marks, [ticket._id]: e.target.value })
                    }
                  />

                  <button
                    onClick={() => handleResolve(ticket._id)}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    disabled={
                      !remarks[ticket._id]?.trim() || resolvingId === ticket._id
                    }
                  >
                    {resolvingId === ticket._id ? "Resolving..." : "Mark as Resolved"}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherEscalatedTickets;
