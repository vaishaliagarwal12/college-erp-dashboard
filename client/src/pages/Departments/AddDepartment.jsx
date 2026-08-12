import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DepartmentForm from "../../components/department/DepartmentForm";

function AddDepartment() {
  const navigate = useNavigate();

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
          <h1 className="page-title">Add Department</h1>
          <p className="page-subtitle">
            Fill in the details to add a new department.
          </p>
        </div>
      </div>

      <DepartmentForm />
    </div>
  );
}

export default AddDepartment;