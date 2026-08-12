import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import StudentForm from "../../components/student/StudentForm";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";

function EditStudent() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/students/${id}`)
      .then((res) => {
        if (active) setStudent(res.data?.data || null);
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load student record. Please try again.")
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
          <h1 className="page-title">Edit Student</h1>
          <p className="page-subtitle">
            Update the student record details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading student…
            </p>
          </div>
        </div>
      ) : error || !student ? (
        <div className="card">
          <EmptyState
            message="Could not load student"
            hint={error || "Student record not found."}
          />
        </div>
      ) : (
        <StudentForm key={student._id} initialData={student} />
      )}
    </div>
  );
}

export default EditStudent;