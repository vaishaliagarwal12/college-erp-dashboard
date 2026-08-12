import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeStudent(s) {
  return {
    _id: s._id || s.id,
    id: s._id || s.id,
    name: `${s.firstName || ""} ${s.lastName || ""}`.trim() || s.name || "",
    rollNo: s.rollNumber || s.rollNo || "",
    image: s.image || "https://i.pravatar.cc/150?img=33",
    course: s.course || "",
    department: s.department || "",
    batch: s.batch ?? "",
    semester: s.semester ?? "",
    section: s.section || "",
    email: s.email || "",
    phone: s.phone || "",
    gender: s.gender || "",
    address: s.address || "",
    status: s.status || "Inactive",
  };
}

function StudentDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = usePermissions();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/students/${id}`)
      .then((res) => {
        if (active) setStudent(normalizeStudent(res.data?.data || null));
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load student. Please try again.")
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page">
        <button
          onClick={() => navigate("/students")}
          className="btn-secondary mb-6 w-fit"
        >
          <FaArrowLeft />
          Back to Students
        </button>
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading student details…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="page">
        <button
          onClick={() => navigate("/students")}
          className="btn-secondary mb-6 w-fit"
        >
          <FaArrowLeft />
          Back to Students
        </button>
        <div className="card">
          <EmptyState
            message="Could not load student"
            hint={error || "Student record not found."}
          />
        </div>
      </div>
    );
  }

  const details = [
    { label: "Name", value: student.name },
    { label: "Roll Number", value: student.rollNo },
    { label: "Course", value: student.course },
    { label: "Department", value: student.department },
    { label: "Batch", value: student.batch },
    { label: "Semester", value: student.semester },
    { label: "Section", value: student.section },
    { label: "Gender", value: student.gender },
    { label: "Email", value: student.email },
    { label: "Phone", value: student.phone },
    { label: "Address", value: student.address || "—" },
  ];

  return (
    <div className="page">
      <button
        onClick={() => navigate("/students")}
        className="btn-secondary mb-6 w-fit"
      >
        <FaArrowLeft />
        Back to Students
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Student Details</h1>
          <p className="page-subtitle">
            Complete profile information for this student.
          </p>
        </div>
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-6 sm:flex-row dark:border-gray-700">
          <img
            src={student.image}
            alt={student.name}
            className="h-24 w-24 rounded-full border-4 border-primary-500 object-cover"
          />

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {student.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Roll No: {student.rollNo} · {student.course}
            </p>

            <span
              className={
                student.status === "Active"
                  ? "badge-active mt-2"
                  : "badge-inactive mt-2"
              }
            >
              {student.status}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {details.map((item) => (
            <div key={item.label}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {item.label}
              </h3>
              <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          {isAdmin && (
            <Link to={`/students/edit/${student.id}`} className="btn-primary">
              <FaEdit />
              Edit Student
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;