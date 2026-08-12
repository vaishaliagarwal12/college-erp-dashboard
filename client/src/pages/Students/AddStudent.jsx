import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import StudentForm from "../../components/student/StudentForm";

function AddStudent() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <button
        onClick={() => navigate("/students")}
        className="btn-secondary mb-6 w-fit"
      >
        <FaArrowLeft />
        Back to Students
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Add Student</h1>
          <p className="page-subtitle">
            Fill in the details to add a new student record.
          </p>
        </div>
      </div>

      <StudentForm />
    </div>
  );
}

export default AddStudent;