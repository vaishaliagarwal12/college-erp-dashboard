import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaEdit } from "react-icons/fa";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeDepartment(d) {
  return {
    ...d,
    _id: d._id || d.id,
    id: d._id || d.id,
    name: d.departmentName || d.name || "",
    code: d.departmentCode || d.code || "",
    hod: d.hod || "",
    faculty: d.totalFaculty ?? d.faculty ?? 0,
    students: d.totalStudents ?? d.students ?? 0,
    status: d.status || "Active",
  };
}

function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [related, setRelated] = useState({
    studentCount: null,
    facultyCount: null,
    courseCount: null,
  });

  useEffect(() => {
    let active = true;

    api
      .get(`/departments/${id}`)
      .then((res) => {
        if (!active) return;
        const dept = normalizeDepartment(res.data?.data || null);
        setDepartment(dept);
        if (!dept) return;

        const deptName = dept.name.toLowerCase();

        Promise.all([
          api.get("/students", { params: { limit: 10000 } }),
          api.get("/faculty", { params: { limit: 10000 } }),
          api.get("/courses", { params: { limit: 10000 } }),
        ])
          .then(([studentsRes, facultyRes, coursesRes]) => {
            if (!active) return;
            setRelated({
              studentCount: (studentsRes.data?.data || []).filter(
                (s) =>
                  String(s.department || "").toLowerCase() === deptName
              ).length,
              facultyCount: (facultyRes.data?.data || []).filter(
                (f) =>
                  String(f.department || "").toLowerCase() === deptName
              ).length,
              courseCount: (coursesRes.data?.data || []).filter(
                (c) =>
                  String(c.department || "").toLowerCase() === deptName
              ).length,
            });
          })
          .catch(() => {
            /* related counts are best-effort; keep null so UI hides them */
          });
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load department. Please try again.")
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
          onClick={() => navigate("/departments")}
          className="btn-secondary mb-6 w-fit"
        >
          <FaArrowLeft />
          Back to Departments
        </button>
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading department details…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="page">
        <button
          onClick={() => navigate("/departments")}
          className="btn-secondary mb-6 w-fit"
        >
          <FaArrowLeft />
          Back to Departments
        </button>
        <div className="card">
          <EmptyState
            message="Department Not Found"
            hint={error || "The department you're looking for doesn't exist."}
          />
        </div>
      </div>
    );
  }

  const hasRelated = Object.values(related).some((v) => v !== null);

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
          <h1 className="page-title">Department Details</h1>
          <p className="page-subtitle">
            Complete profile information for this department.
          </p>
        </div>

        {isAdmin && (
          <Link
            to={`/departments/edit/${department.id}`}
            className="btn-primary"
          >
            <FaEdit />
            Edit Department
          </Link>
        )}
      </div>

      <div className="card p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Department Name
            </h3>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {department.name}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Department Code
            </h3>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {department.code}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Head of Department
            </h3>
            <p className="mt-1 font-semibold text-gray-900 dark:text-white">
              {department.hod}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </h3>
            <span
              className={
                department.status === "Active"
                  ? "badge-active"
                  : "badge-inactive"
              }
            >
              {department.status}
            </span>
          </div>
        </div>
      </div>

      {hasRelated && (
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Related Records
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.studentCount !== null && (
              <div className="card p-6">
                <h3 className="stat-label">Students</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
                  {related.studentCount}
                </p>
              </div>
            )}
            {related.facultyCount !== null && (
              <div className="card p-6">
                <h3 className="stat-label">Faculty</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
                  {related.facultyCount}
                </p>
              </div>
            )}
            {related.courseCount !== null && (
              <div className="card p-6">
                <h3 className="stat-label">Courses</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 tabular-nums dark:text-white">
                  {related.courseCount}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentDetails;