import { useEffect, useState } from "react";
import { MdDownload, MdAdd, MdRedo } from "react-icons/md";
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
  const [roomFilter, setRoomFilter] = useState("");

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

    const matchesRoom = roomFilter === "" || entry.room === roomFilter;

    return matchesDepartment && matchesSemester && matchesRoom;
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
          prev.map((entry) => (entry._id === updated._id ? updated : entry))
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

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary tracking-tight">
            Class Schedule
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage and view weekly academic timetables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-outline bg-surface-container-lowest px-4 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <MdDownload className="text-[18px]" />
            Export PDF
          </button>

          {isAdmin && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 font-label-md text-label-md text-on-secondary shadow-sm transition-colors hover:bg-secondary-container"
            >
              <MdAdd className="text-[18px]" />
              Create Schedule
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-primary-container dark:bg-primary">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading timetable…
            </p>
          </div>
        </div>
      ) : error && entries.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-primary-container dark:bg-primary">
          <EmptyState message="Could not load timetable" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <MdRedo />
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
            roomFilter={roomFilter}
            setRoomFilter={setRoomFilter}
          />

          {filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-primary-container dark:bg-primary">
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
