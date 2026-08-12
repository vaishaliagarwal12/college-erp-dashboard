import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import FacultyForm from "../../components/Faculty/FacultyForm";

function AddFaculty() {
  const navigate = useNavigate();

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
          <h1 className="page-title">Add Faculty</h1>
          <p className="page-subtitle">
            Fill in the details to add a new faculty member.
          </p>
        </div>
      </div>

      <FacultyForm />
    </div>
  );
}

export default AddFaculty;