import { MdSearch, MdExpandMore } from "react-icons/md";

function SelectField({ value, onChange, label, options }) {
  return (
    <div className="relative w-full sm:w-auto">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full cursor-pointer appearance-none rounded-lg border-none bg-surface-container-low py-2 pl-4 pr-10 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary dark:bg-gray-800 dark:text-gray-100 sm:w-auto"
      >
        <option value="">{label === "Status" ? "All Statuses" : `All ${label}s`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <MdExpandMore className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline dark:text-gray-500" />
    </div>
  );
}

function CourseToolbar({
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
  statusFilter,
  setStatusFilter,
  departments,
  totalCount,
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900 lg:flex-row">
      <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <MdSearch className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline dark:text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or code..."
            className="w-full rounded-lg border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-secondary dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Filters */}
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:w-auto">
          <SelectField
            value={departmentFilter}
            onChange={setDepartmentFilter}
            label="Department"
            options={departments}
          />
          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            label="Status"
            options={["Active", "Inactive"]}
          />
        </div>
      </div>

      {/* Count */}
      <div className="self-start text-sm text-on-surface-variant dark:text-gray-400 lg:self-center">
        <span className="font-semibold text-primary dark:text-white">
          {totalCount.toLocaleString()}
        </span>{" "}
        Total Courses
      </div>
    </div>
  );
}

export default CourseToolbar;
