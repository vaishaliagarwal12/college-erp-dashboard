import { useEffect, useMemo, useState } from "react";
import { MdDownload, MdPersonAdd, MdRedo } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import FacultyToolbar from "../../components/Faculty/FacultyToolbar";
import FacultyTable from "../../components/Faculty/FacultyTable";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

const PAGE_SIZE = 10;

function normalizeFaculty(f) {
  return {
    ...f,
    _id: f._id || f.id,
    id: f._id || f.id,
    name: `${f.firstName || ""} ${f.lastName || ""}`.trim() || f.name || "",
    employeeId: f.employeeId || f.employeeID || "",
    department: f.department || "",
    designation: f.designation || "",
    status: f.status || "Inactive",
  };
}

function Faculty() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  const [facultyList, setFacultyList] = useState([]);
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchFaculty = () => {
    api
      .get("/faculty")
      .then((res) => {
        setFacultyList((res.data?.data || []).map(normalizeFaculty));
      })
      .catch((err) => {
        setError(getErrorMessage(err, "Unable to load faculty. Please try again."));
      });

    api
      .get("/courses", { params: { limit: 10000 } })
      .then((res) => setCourseList(res.data?.data || []))
      .catch(() => {})
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

  const departments = useMemo(() => {
    return [...new Set(facultyList.map((f) => f.department).filter(Boolean))].sort();
  }, [facultyList]);

  const designations = useMemo(() => {
    return [...new Set(facultyList.map((f) => f.designation).filter(Boolean))].sort();
  }, [facultyList]);

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

      return matchesSearch && matchesDepartment && matchesDesignation;
    });
  }, [facultyList, searchTerm, departmentFilter, designationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredFaculty.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageFaculty = filteredFaculty.slice(
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

  const handleDesignation = (value) => {
    setDesignationFilter(value);
    setPage(1);
  };

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

  const handleExport = () => {
    const headers = [
      "Name",
      "Employee ID",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Qualification",
      "Experience",
      "Status",
    ];
    const rows = filteredFaculty.map((f) => [
      f.name,
      f.employeeId,
      f.email,
      f.phone,
      f.department,
      f.designation,
      f.qualification,
      f.experience,
      f.status,
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
    link.download = "faculty.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasFilters =
    searchTerm !== "" || departmentFilter !== "" || designationFilter !== "";

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[32px] font-bold leading-10 tracking-tight text-primary dark:text-white">
            Faculty
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant dark:text-gray-400">
            Manage faculty profiles, department assignments, and teaching records.
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
              onClick={() => navigate("/faculty/add")}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-on-secondary shadow-sm transition-colors hover:bg-secondary-container active:scale-[0.98] sm:flex-none"
            >
              <MdPersonAdd className="text-[18px]" />
              Add New Faculty
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
              Loading faculty…
            </p>
          </div>
        </div>
      ) : error && facultyList.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <EmptyState message="Could not load faculty" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <MdRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <FacultyToolbar
            searchTerm={searchTerm}
            setSearchTerm={handleSearch}
            departmentFilter={departmentFilter}
            setDepartmentFilter={handleDepartment}
            designationFilter={designationFilter}
            setDesignationFilter={handleDesignation}
            departments={departments}
            designations={designations}
            totalCount={filteredFaculty.length}
          />

          <FacultyTable
            faculty={pageFaculty}
            total={filteredFaculty.length}
            courses={courseList}
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

export default Faculty;
