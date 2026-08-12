import { FaPlus, FaRedo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import FacultySearch from "../../components/Faculty/FacultySearch";
import FacultyFilters from "../../components/Faculty/FacultyFilters";
import FacultyStats from "../../components/Faculty/FacultyStats";
import FacultyTable from "../../components/Faculty/FacultyTable";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeFaculty(f) {
  return {
    ...f,
    _id: f._id || f.id,
    id: f._id || f.id,
    name: `${f.firstName || ""} ${f.lastName || ""}`.trim() || f.name || "",
    image: f.image || "https://i.pravatar.cc/150?img=18",
  };
}

function Faculty() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchFaculty = () => {
    api
      .get("/faculty")
      .then((res) => {
        const rows = (res.data?.data || []).map(normalizeFaculty);
        setFacultyList(rows);
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Unable to load faculty. Please try again."));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    fetchFaculty();
  };

  const filteredFaculty = useMemo(() => {
    return facultyList.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment =
        departmentFilter === "" || teacher.department === departmentFilter;

      const matchesDesignation =
        designationFilter === "" || teacher.designation === designationFilter;

      const matchesStatus =
        statusFilter === "" || teacher.status === statusFilter;

      return (
        matchesSearch && matchesDepartment && matchesDesignation && matchesStatus
      );
    });
  }, [facultyList, searchTerm, departmentFilter, designationFilter, statusFilter]);

  const handleDelete = async (teacher) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${teacher.name} (${teacher.employeeId})?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/faculty/${teacher._id}`);
      setFacultyList((prev) => prev.filter((t) => t._id !== teacher._id));
    } catch (err) {
      window.alert(getErrorMessage(err, "Failed to delete faculty member."));
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Management</h1>
          <p className="page-subtitle">
            View, filter and manage faculty members.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate("/faculty/add")}
            className="btn-primary"
          >
            <FaPlus />
            Add Faculty
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading faculty…
            </p>
          </div>
        </div>
      ) : error && facultyList.length === 0 ? (
        <div className="card">
          <EmptyState message="Could not load faculty" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <FaRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <FacultyStats faculty={filteredFaculty} />

          {/* Search */}
          <FacultySearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <FacultyFilters
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            designationFilter={designationFilter}
            setDesignationFilter={setDesignationFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <FacultyTable faculty={filteredFaculty} onDelete={handleDelete} />
        </>
      )}
    </div>
  );
}

export default Faculty;