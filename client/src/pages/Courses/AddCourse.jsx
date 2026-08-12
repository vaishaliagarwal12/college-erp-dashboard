import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import CourseForm from "../../components/course/CourseForm";

function AddCourse() {
  const navigate = useNavigate();

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
          <h1 className="page-title">Add Course</h1>
          <p className="page-subtitle">
            Fill in the details to add a new course.
          </p>
        </div>
      </div>

      <CourseForm />
    </div>
  );
}

export default AddCourse;