import { useEffect, useState } from "react";
import axios from "axios";

const PORT = import.meta.env.VITE_BACKEND_PORT || 5000;

interface Student {
  _id: string;
  name: string;
  email: string;
  course?: string;
  batch?: string;
}

interface Course {
  _id: string;
  name: string;
  batches: { _id: string; name: string }[];
}

export default function Students() {
  const token = localStorage.getItem("token");

  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showCourse,setShowCourse]=useState(false)

  useEffect(() => {
    axios
      .get(`http://localhost:${PORT}/api/teacher/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCourses(res.data.courses))
      .catch(console.error);
  }, []);


  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:${PORT}/api/teacher/students`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAllStudents(res.data.students))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(()=>{
      const handleViewStudents = async () => {
    if (!selectedCourse || !selectedBatch) {
      
      setStudents(allStudents);
      return;
    }
    setShowCourse(true)
    setFilterLoading(true);
    try {
     const res = await axios.post(
  `http://localhost:${PORT}/api/teacher/filter`,
  {
    courseId:selectedCourse,
    batch:selectedBatch
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
      setStudents(res.data.students);
      
    } catch (err) {
      setStudents([]);
    } finally {
      setFilterLoading(false);
    }
  };
   handleViewStudents()
  },[selectedBatch,selectedCourse])


  const data =
    selectedCourse && selectedBatch ? students : allStudents;

  const isLoading =
    selectedCourse && selectedBatch ? filterLoading : loading;

  function renderTable(data: Student[]) {
    return (
      <table className="w-full max-w-6xl text-left border-separate border-spacing-y-4">
        <thead>
          <tr className="text-primary font-bold text-base">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
          
            { showCourse&&
            <>
             <th className="px-4 py-2">Course</th>
             <th className="px-4 py-2">Batch</th>
            </>
            }
      
          </tr>
        </thead>
        <tbody>
          {data.map((s) => (
            <tr
              key={s._id}
              className="bg-white hover:bg-[#f6e6ff] transition shadow-sm rounded-xl"
            >
              <td className="px-4 py-2 font-semibold">{s.name}</td>
              <td className="px-4 py-2">{s.email}</td>
              <td className="px-4 py-2">
                {
                  courses.find((c) => c._id === s.course)?.name
                }
              </td>
              <td className="px-4 py-2">
                {
                  courses
                    .find((c) => c._id === s.course)
                    ?.batches.find((b) => b._id === s.batch)
                    ?.name
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div
      className="flex flex-col items-center w-full min-h-screen pt-10 px-6 pb-20"
      style={{ background: "#fdf8f4" }}
    >
      <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800">
        Students Portal
      </h2>

      {/* Filters */}
      <div className="flex flex-row gap-8 mb-10 justify-center items-center w-full max-w-2xl">
        <select
          className="border-2 border-purple-200 px-5 py-2 rounded-xl shadow-sm bg-white"
          value={selectedCourse}
          onChange={(e) => {
            setSelectedCourse(e.target.value);
            setSelectedBatch("");
          }}
        >
          <option value="">Select Course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="border-2 border-purple-200 px-5 py-2 rounded-xl shadow-sm bg-white"
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          disabled={!selectedCourse}
        >
          <option value="">Select Batch</option>
          {courses
            .find((c) => c._id === selectedCourse)
            ?.batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
        </select>

     
      </div>

      
      {isLoading ? (
        <div className="text-lg mt-20 text-gray-400">
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div className="text-2xl mt-20 text-gray-500">
          No students found.
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div className="w-full max-w-6xl">
            {renderTable(data)}
          </div>
        </div>
      )}
    </div>
  );
}