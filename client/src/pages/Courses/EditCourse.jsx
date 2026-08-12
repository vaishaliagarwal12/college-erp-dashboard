import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import CourseForm from "../../components/course/CourseForm";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";

function EditCourse() {
  const navigate = useNavigate();
  const { id } = useParams();

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
          <h1 className="page-title">Edit Course</h1>
          <p className="page-subtitle">
            Update the course record details.
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
      ) : course ? (
        <CourseForm key={course._id} initialData={course} />
      ) : (
        <div className="card">
          <EmptyState
            message="Course not found"
            hint="This record may have been deleted."
          />
        </div>
      )}
    </div>
  );
}

export default EditCourse;