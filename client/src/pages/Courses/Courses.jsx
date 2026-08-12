import { useEffect, useMemo, useState } from "react";
import { MdDownload, MdAdd, MdRedo } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import CourseToolbar from "../../components/course/CourseToolbar";
import CourseTable from "../../components/course/CourseTable";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

const PAGE_SIZE = 10;

function normalizeCourse(c) {
  return {
    ...c,
    _id: c._id || c.id,
    id: c._id || c.id,
    instructor: c.instructor || "",
    department: c.department || "",
    status: c.status || "Inactive",
  };
}

function Courses() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchCourses = () => {
    api
      .get("/courses")
      .then((res) => {
        setCourseList((res.data?.data || []).map(normalizeCourse));
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Unable to load courses. Please try again."));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    fetchCourses();
  };

  const departments = useMemo(() => {
    return [...new Set(courseList.map((c) => c.department).filter(Boolean))].sort();
  }, [courseList]);

  const filteredCourses = useMemo(() => {
    return courseList.filter((course) => {
      const matchesSearch =
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === "" || course.department === departmentFilter;

      const matchesStatus = statusFilter === "" || course.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [courseList, searchTerm, departmentFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageCourses = filteredCourses.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleDepartment = (value) => {
    setDepartmentFilter(value);
    setPage(1);
  };

  const handleStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${course.courseName} (${course.courseCode})?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/courses/${course._id}`);
      setCourseList((prev) => prev.filter((c) => c._id !== course._id));
    } catch (err) {
      window.alert(getErrorMessage(err, "Failed to delete course."));
    }
  };

  const handleExport = () => {
    const headers = [
      "Course Name",
      "Course Code",
      "Department",
      "Credits",
      "Semester",
      "Instructor",
      "Status",
    ];
    const rows = filteredCourses.map((c) => [
      c.courseName,
      c.courseCode,
      c.department,
      c.credits,
      c.semester,
      c.instructor,
      c.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "courses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters =
    searchTerm !== "" || departmentFilter !== "" || statusFilter !== "";

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[32px] font-bold leading-10 tracking-tight text-primary dark:text-white">
            Courses
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant dark:text-gray-400">
            Manage course catalog, credits, and instructor assignments.
          </p>
        </div>

        <div className="flex w-full items-center gap-4 sm:w-auto">
          <button
            onClick={handleExport}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-low dark:border-gray-600 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 sm:flex-none"
          >
            <MdDownload className="text-[18px]" />
            Export CSV
          </button>

          {isAdmin && (
            <button
              onClick={() => navigate("/courses/add")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-on-secondary shadow-sm transition-colors hover:bg-secondary-container active:scale-[0.98] sm:flex-none"
            >
              <MdAdd className="text-[18px]" />
              Add New Course
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading courses…
            </p>
          </div>
        </div>
      ) : error && courseList.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <EmptyState message="Could not load courses" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <MdRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <CourseToolbar
            searchTerm={searchTerm}
            setSearchTerm={handleSearch}
            departmentFilter={departmentFilter}
            setDepartmentFilter={handleDepartment}
            statusFilter={statusFilter}
            setStatusFilter={handleStatus}
            departments={departments}
            totalCount={filteredCourses.length}
          />

          <CourseTable
            courses={pageCourses}
            total={filteredCourses.length}
            onDelete={handleDelete}
            page={safePage}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            hasFilters={hasFilters}
          />
        </>
      )}
    </div>
  );
}

export default Courses;
