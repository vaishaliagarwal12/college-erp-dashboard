import { useEffect, useMemo, useState } from "react";
import { MdAdd, MdSearch, MdRedo } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import DepartmentCards from "../../components/department/DepartmentCards";
import RecentAssignments from "../../components/department/RecentAssignments";
import QuickAssignmentForm from "../../components/department/QuickAssignmentForm";
import SystemStatusCard from "../../components/department/SystemStatusCard";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeDepartment(d) {
  return {
    ...d,
    _id: d._id || d.id,
    name: d.departmentName || d.name || "",
    code: d.departmentCode || d.code || "",
    hod: d.hod || "",
    faculty: d.totalFaculty ?? d.faculty ?? 0,
    students: d.totalStudents ?? d.students ?? 0,
    status: d.status || "Active",
  };
}

function normalizeCourse(c) {
  return {
    ...c,
    _id: c._id || c.id,
    instructor: c.instructor || "",
    createdAt: c.createdAt || "",
  };
}

function Departments() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const [departmentList, setDepartmentList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = () => {
    api
      .get("/departments")
      .then((res) => {
        setDepartmentList((res.data?.data || []).map(normalizeDepartment));
      })
      .catch((err) => {
        setError(
          getErrorMessage(err, "Unable to load departments. Please try again.")
        );
      });

    api
      .get("/courses", { params: { limit: 10000 } })
      .then((res) => {
        setCourseList((res.data?.data || []).map(normalizeCourse));
      })
      .catch(() => {
        /* keep the list empty if the courses API is unavailable */
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    fetchData();
  };

  const filteredDepartments = useMemo(() => {
    return departmentList.filter((department) => {
      const matchesSearch =
        department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        department.hod.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [departmentList, searchTerm]);

  const unassignedCourses = courseList.filter(
    (c) => !c.instructor
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[32px] font-bold leading-10 tracking-tight text-primary dark:text-white">
            Course &amp; Department Management
          </h2>
          <p className="mt-1 text-base text-on-surface-variant dark:text-gray-400">
            Overview of academic structures and current assignments.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate("/departments/add")}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-secondary px-6 py-2.5 text-xs font-semibold text-on-secondary shadow-sm transition-colors hover:bg-secondary-container active:scale-[0.98]"
          >
            <MdAdd className="text-[18px]" />
            New Department
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading departments…
            </p>
          </div>
        </div>
      ) : error && departmentList.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <EmptyState message="Could not load departments" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <MdRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: departments + assignments */}
          <div className="flex flex-col gap-4 lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xl font-semibold text-primary dark:text-white">
                Academic Departments
              </h3>

              <div className="relative sm:w-64">
                <MdSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant dark:text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search departments..."
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-9 pr-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary focus:ring-2 focus:ring-secondary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {filteredDepartments.length === 0 ? (
              <EmptyState
                message="No departments found"
                hint="Try adjusting your search, or add a new department."
              />
            ) : (
              <DepartmentCards
                departments={filteredDepartments}
                courses={courseList}
                onOpen={(d) => navigate(`/departments/details/${d._id}`)}
                onEdit={(d) => navigate(`/departments/edit/${d._id}`)}
              />
            )}

            <div className="mt-4">
              <RecentAssignments courses={courseList} />
            </div>
          </div>

          {/* Right: quick actions + status */}
          <div className="flex flex-col gap-6 lg:col-span-4">
            <QuickAssignmentForm
              departments={departmentList}
              onCreated={fetchData}
            />
            <SystemStatusCard unassignedCourses={unassignedCourses} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Departments;
