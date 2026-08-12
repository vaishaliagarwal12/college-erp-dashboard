import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FacultyForm from "../../components/Faculty/FacultyForm";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";

function EditFaculty() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/faculty/${id}`)
      .then((res) => {
        if (active) setFaculty(res.data?.data || null);
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load faculty member. Please try again.")
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
        onClick={() => navigate("/faculty")}
        className="btn-secondary mb-6 w-fit"
      >
        <FaArrowLeft />
        Back to Faculty
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Faculty</h1>
          <p className="page-subtitle">
            Update the faculty member record details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading faculty member…
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState message="Could not load faculty member" hint={error} />
        </div>
      ) : faculty ? (
        <FacultyForm initialData={faculty} />
      ) : (
        <div className="card">
          <EmptyState message="Faculty member not found" hint="This record may have been deleted." />
        </div>
      )}
    </div>
  );
}

export default EditFaculty;