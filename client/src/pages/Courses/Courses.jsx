import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import CourseStats from "../../components/course/CourseStats";
import CourseSearch from "../../components/course/CourseSearch";
import CourseFilters from "../../components/course/CourseFilters";
import CourseTable from "../../components/course/CourseTable";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeCourse(c) {
  return {
    ...c,
    _id: c._id || c.id,
    id: c._id || c.id,
    instructor: c.instructor || "",
    description: c.description || "",
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
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [creditsFilter, setCreditsFilter] = useState("");

  const fetchCourses = () => {
    api
      .get("/courses")
      .then((res) => {
        const rows = (res.data?.data || []).map(normalizeCourse);
        setCourseList(rows);
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

  const filteredCourses = useMemo(
    () =>
      courseList.filter((course) => {
        const matchesSearch =
          course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.courseCode.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment =
          departmentFilter === "" ||
          course.department === departmentFilter;

        const matchesSemester =
          semesterFilter === "" ||
          course.semester === Number(semesterFilter);

        const matchesStatus =
          statusFilter === "" || course.status === statusFilter;

        const matchesCredits =
          creditsFilter === "" ||
          course.credits === Number(creditsFilter);

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesSemester &&
          matchesStatus &&
          matchesCredits
        );
      }),
    [courseList, searchTerm, departmentFilter, semesterFilter, statusFilter, creditsFilter]
  );

  const hasFilters =
    searchTerm !== "" ||
    departmentFilter !== "" ||
    semesterFilter !== "" ||
    statusFilter !== "" ||
    creditsFilter !== "";

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

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">
            View, filter and manage college courses.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate("/courses/add")}
            className="btn-primary"
          >
            <FaPlus />
            Add Course
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading courses…
            </p>
          </div>
        </div>
      ) : error && courseList.length === 0 ? (
        <div className="card">
          <EmptyState message="Could not load courses" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <FaRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <CourseStats courses={filteredCourses} />

          <CourseSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          <CourseFilters
            courses={courseList}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            creditsFilter={creditsFilter}
            setCreditsFilter={setCreditsFilter}
          />

          <CourseTable
            courses={filteredCourses}
            onDelete={handleDelete}
            hasFilters={hasFilters}
          />
        </>
      )}
    </div>
  );
}

export default Courses;