function TimetableFilters({
  entries,
  departmentFilter,
  setDepartmentFilter,
  semesterFilter,
  setSemesterFilter,
  roomFilter,
  setRoomFilter,
}) {
  const departments = [...new Set(entries.map((e) => e.department).filter(Boolean))];
  const semesters = [...new Set(entries.map((e) => e.semester).filter((s) => s != null))].sort(
    (a, b) => a - b
  );
  const rooms = [...new Set(entries.map((e) => e.room).filter(Boolean))].sort();

  const selectClass =
    "w-full bg-surface-container-low border-none rounded-md text-body-md text-on-surface focus:ring-2 focus:ring-secondary outline-none py-2 px-3";

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-md shadow-sm flex flex-wrap gap-md items-center">
      <div className="flex flex-col gap-xs flex-1 min-w-[200px]">
        <label className="font-label-md text-label-md text-on-surface-variant">Department</label>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className={selectClass}
          aria-label="Filter by department"
        >
          <option value="">All Departments</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-xs flex-1 min-w-[200px]">
        <label className="font-label-md text-label-md text-on-surface-variant">Semester</label>
        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className={selectClass}
          aria-label="Filter by semester"
        >
          <option value="">All Semesters</option>
          {semesters.map((semester) => (
            <option key={semester} value={semester}>
              Semester {semester}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-xs flex-1 min-w-[200px]">
        <label className="font-label-md text-label-md text-on-surface-variant">Classroom / Lab</label>
        <select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className={selectClass}
          aria-label="Filter by room"
        >
          <option value="">All Rooms</option>
          {rooms.map((room) => (
            <option key={room} value={room}>
              {room}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default TimetableFilters;
