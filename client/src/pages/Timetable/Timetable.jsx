import { useEffect, useState } from "react";
import { FaPlus, FaCalendarAlt, FaRedo } from "react-icons/fa";
import TimetableFilters from "../../components/timetable/TimetableFilters";
import TimetableGrid from "../../components/timetable/TimetableGrid";
import TimetableCards from "../../components/timetable/TimetableCards";
import TimetableModal from "../../components/timetable/TimetableModal";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";

function normalizeEntry(entry) {
  return {
    ...entry,
    _id: entry._id || entry.id,
    id: entry._id || entry.id,
  };
}

function Timetable() {
  const { isAdmin } = usePermissions();
  const [entries, setEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [departmentFilter, setDepartmentFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [activeEntry, setActiveEntry] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    setReloadKey((k) => k + 1);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesDepartment =
      departmentFilter === "" || entry.department === departmentFilter;

    const matchesSemester =
      semesterFilter === "" || entry.semester === Number(semesterFilter);

    const matchesSection =
      sectionFilter === "" || entry.section === sectionFilter;

    const matchesFaculty =
      facultyFilter === "" || entry.faculty === facultyFilter;

    return (
      matchesDepartment && matchesSemester && matchesSection && matchesFaculty
    );
  });

  const openView = (entry) => {
    setActiveEntry(entry);
    setModalMode("view");
    setModalOpen(true);
  };

  const openAdd = () => {
    setActiveEntry(null);
    setModalMode("form");
    setModalOpen(true);
  };

  const openEdit = () => {
    setModalMode("form");
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveEntry(null);
  };

  const handleSave = async (data) => {
    try {
      const payload = { ...data };
      delete payload._id;
      if (data._id) {
        const res = await api.put(`/timetable/${data._id}`, payload);
        const updated = normalizeEntry(res.data?.data || payload);
        setEntries((prev) =>
          prev.map((entry) =>
            entry._id === updated._id ? updated : entry
          )
        );
      } else {
        const res = await api.post("/timetable", payload);
        const created = normalizeEntry(res.data?.data || payload);
        setEntries((prev) => [...prev, created]);
      }
      closeModal();
    } catch (err) {
      window.alert(getErrorMessage(err, "Failed to save timetable entry."));
    }
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(
      `Delete the ${entry.courseName} class on ${entry.day} at ${entry.startTime}?`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/timetable/${entry._id}`);
      setEntries((prev) => prev.filter((item) => item._id !== entry._id));
      closeModal();
    } catch (err) {
      window.alert(getErrorMessage(err, "Failed to delete timetable entry."));
    }
  };

  useEffect(() => {
    let active = true;

    api
      .get("/timetable")
      .then((res) => {
        if (active) setEntries((res.data?.data || []).map(normalizeEntry));
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Unable to load timetable. Please try again."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    api
      .get("/courses")
      .then((res) => {
        if (active) {
          setCourses((res.data?.data || []).map(normalizeEntry));
        }
      })
      .catch(() => {
        /* courses are optional for the timetable grid */
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">
            Weekly schedule for all classes and sections.
          </p>

          <span className="badge-neutral mt-3">
            <FaCalendarAlt />
            Academic Year 2025-26
          </span>
        </div>

        {isAdmin && (
          <button onClick={openAdd} className="btn-primary">
            <FaPlus />
            Add Class
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="card">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading timetable…
            </p>
          </div>
        </div>
      ) : error && entries.length === 0 ? (
        <div className="card">
          <EmptyState message="Could not load timetable" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <FaRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <TimetableFilters
            entries={entries}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            semesterFilter={semesterFilter}
            setSemesterFilter={setSemesterFilter}
            sectionFilter={sectionFilter}
            setSectionFilter={setSectionFilter}
            facultyFilter={facultyFilter}
            setFacultyFilter={setFacultyFilter}
          />

          {filteredEntries.length === 0 ? (
            <div className="table-card">
              <EmptyState
                message={
                  entries.length === 0
                    ? "No classes scheduled yet"
                    : "No classes match your filters"
                }
                hint={
                  entries.length === 0
                    ? "Add your first class to get started."
                    : "Try adjusting your search or filters."
                }
              />
            </div>
          ) : (
            <>
              <TimetableGrid entries={filteredEntries} onView={openView} />

              <TimetableCards entries={filteredEntries} onView={openView} />
            </>
          )}
        </>
      )}

      {modalOpen && (
        <TimetableModal
          key={`${modalMode}-${activeEntry?.id || "new"}`}
          mode={modalMode}
          entry={activeEntry}
          courses={courses}
          onClose={closeModal}
          onSave={handleSave}
          onRequestEdit={openEdit}
          onDelete={() => handleDelete(activeEntry)}
        />
      )}
    </div>
  );
}

export default Timetable;