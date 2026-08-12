import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBook, FaEdit } from "react-icons/fa";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get(`/courses/${id}`)
      .then((res) => {
        if (active) setCourse(res.data?.data || null);
      })
      .catch((err) => {
        if (active) {
          setError(
            getErrorMessage(err, "Unable to load course. Please try again.")
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

  const openEdit = () => navigate(`/courses/edit/${course?._id}`);

  return (
    <div className="page">
      <button
        onClick={() => navigate("/courses")}
        className="btn-secondary mb-6 w-fit"
      >
        <FaArrowLeft />
        Back to Courses
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Course Details</h1>
          <p className="page-subtitle">
            Complete information for this course.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading course…
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState message="Could not load course" hint={error} />
        </div>
      ) : !course ? (
        <div className="card">
          <EmptyState
            message="Course Not Found"
            hint="The course you're looking for doesn't exist."
          />
        </div>
      ) : (
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center dark:border-gray-700">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600 p-3">
              <FaBook className="text-2xl text-white" />
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {course.courseName}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {course.courseCode} · {course.department}
              </p>

              <span
                className={
                  course.status === "Active"
                    ? "badge-active mt-2"
                    : "badge-inactive mt-2"
                }
              >
                {course.status}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Course Code", value: course.courseCode },
              { label: "Department", value: course.department },
              { label: "Credits", value: course.credits },
              { label: "Instructor", value: course.instructor || "—" },
              { label: "Semester", value: `Semester ${course.semester}` },
            ].map((item) => (
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

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Description
            </h3>

            <p className="text-gray-700 dark:text-gray-200">
              {course.description || "—"}
            </p>
          </div>

          <div className="mt-8 flex justify-end">
            {isAdmin && (
              <button onClick={openEdit} className="btn-primary">
                <FaEdit />
                Edit Course
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetails;