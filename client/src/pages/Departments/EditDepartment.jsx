import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DepartmentForm from "../../components/department/DepartmentForm";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";

function EditDepartment() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/departments/${id}`)
      .then((res) => {
        if (active) setDepartment(res.data?.data || null);
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load department record. Please try again.")
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
        onClick={() => navigate("/departments")}
        className="btn-secondary mb-6 w-fit"
      >
        <FaArrowLeft />
        Back to Departments
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Department</h1>
          <p className="page-subtitle">
            Update the department record details.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading department…
            </p>
          </div>
        </div>
      ) : error || !department ? (
        <div className="card">
          <EmptyState
            message="Could not load department"
            hint={error || "Department record not found."}
          />
        </div>
      ) : (
        <DepartmentForm key={department._id} initialData={department} />
      )}
    </div>
  );
}

export default EditDepartment;