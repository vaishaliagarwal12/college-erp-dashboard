import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeFaculty(f) {
  return {
    ...f,
    _id: f._id || f.id,
    id: f._id || f.id,
    name: `${f.firstName || ""} ${f.lastName || ""}`.trim() || f.name || "",
    image: f.image || "https://i.pravatar.cc/150?img=18",
  };
}

function FacultyDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = usePermissions();

  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/faculty/${id}`)
      .then((res) => {
        if (active) setFaculty(normalizeFaculty(res.data?.data || null));
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
          <h1 className="page-title">Faculty Details</h1>
          <p className="page-subtitle">
            Complete profile information for this faculty member.
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
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 border-b border-gray-100 pb-6 sm:flex-row dark:border-gray-700">
            <img
              src={faculty.image}
              alt={faculty.name}
              className="h-24 w-24 rounded-full border-4 border-primary-500 object-cover"
            />

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {faculty.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {faculty.employeeId} · {faculty.designation}
              </p>

              <span
                className={`mt-2 ${faculty.status === "Active" ? "badge-active" : "badge-inactive"}`}
              >
                {faculty.status}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Employee ID", value: faculty.employeeId },
              { label: "Gender", value: faculty.gender },
              { label: "Department", value: faculty.department },
              { label: "Designation", value: faculty.designation },
              { label: "Qualification", value: faculty.qualification },
              {
                label: "Experience",
                value:
                  faculty.experience != null
                    ? `${faculty.experience} Years`
                    : "—",
              },
              { label: "Email", value: faculty.email },
              { label: "Phone", value: faculty.phone },
              { label: "Status", value: faculty.status },
            ].map((item) => (
              <div key={item.label}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </h3>
                <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                  {item.value || "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            {isAdmin && (
              <button
                onClick={() => navigate(`/faculty/edit/${faculty.id}`)}
                className="btn-primary"
              >
                <FaEdit />
                Edit Faculty
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState
            message="Faculty member not found"
            hint="This record may have been deleted."
          />
        </div>
      )}
    </div>
  );
}

export default FacultyDetails;