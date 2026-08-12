import {
  MdVisibility,
  MdEdit,
  MdDelete,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import EmptyState from "../ui/EmptyState";
import { usePermissions } from "../../hooks/usePermissions";

function statusBadge(status) {
  if (status === "Active") {
    return "bg-[#dcfce7] text-[#166534] dark:bg-emerald-500/15 dark:text-emerald-400";
  }
  return "bg-error-container text-on-error-container dark:bg-red-500/15 dark:text-red-300";
}

function getPageItems(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items = [];
  let prev = 0;
  sorted.forEach((p) => {
    if (p - prev > 1) items.push("...");
    items.push(p);
    prev = p;
  });
  return items;
}

function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const pageButton =
    "flex h-8 w-8 items-center justify-center rounded text-xs font-semibold transition-colors";
  const navButton =
    "flex h-8 w-8 items-center justify-center rounded text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50 disabled:hover:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800";

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-outline-variant bg-[#f8fafc] px-4 py-3 sm:flex-row dark:border-gray-700/60 dark:bg-gray-900">
      <span className="text-[13px] text-on-surface-variant dark:text-gray-400">
        Showing {from} to {to} of {total.toLocaleString()} entries
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={navButton}
          aria-label="Previous page"
        >
          <MdChevronLeft className="text-xl" />
        </button>

        {getPageItems(page, totalPages).map((item, index) =>
          item === "..." ? (
            <span key={`ellipsis-${index}`} className="px-1 text-outline dark:text-gray-500">
              ...
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`${pageButton} ${
                item === page
                  ? "bg-secondary text-white"
                  : "text-on-surface hover:bg-surface-container-low dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={navButton}
          aria-label="Next page"
        >
          <MdChevronRight className="text-xl" />
        </button>
      </div>
    </div>
  );
}

function CourseTable({
  courses,
  total = courses.length,
  onDelete,
  page = 1,
  pageSize = 10,
  onPageChange,
  hasFilters = false,
}) {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900">
        <EmptyState
          message={hasFilters ? "No courses match your search" : "No courses found"}
          hint={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first course to get started."
          }
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant bg-[#f1f5f9] dark:border-gray-700/60 dark:bg-gray-800/70">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Course
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Department
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Credits
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Semester
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Instructor
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {courses.map((course) => (
              <tr
                key={course._id}
                className="group border-b border-outline-variant transition-colors last:border-none hover:bg-surface-container-low dark:border-gray-700/60 dark:hover:bg-gray-800/60"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-secondary-fixed px-2 py-1 text-xs font-semibold text-on-secondary-fixed dark:bg-secondary/30 dark:text-secondary-fixed-dim">
                      {course.courseCode}
                    </span>
                    <span className="font-semibold text-primary dark:text-gray-100">
                      {course.courseName}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-on-surface dark:text-gray-200">
                  {course.department}
                </td>

                <td className="px-4 py-4 text-sm font-medium text-on-surface-variant tabular-nums dark:text-gray-400">
                  {course.credits}
                </td>

                <td className="px-4 py-4 text-sm font-medium text-on-surface-variant tabular-nums dark:text-gray-400">
                  {course.semester}
                </td>

                <td className="px-4 py-4 text-sm text-on-surface-variant dark:text-gray-400">
                  {course.instructor || "Unassigned"}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase ${statusBadge(
                      course.status
                    )}`}
                  >
                    {course.status || "Inactive"}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => navigate(`/courses/details/${course._id}`)}
                      className="p-1 text-on-surface-variant transition-colors hover:text-secondary dark:text-gray-400"
                      title="View Details"
                      aria-label={`View ${course.courseName}`}
                    >
                      <MdVisibility className="text-xl" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => navigate(`/courses/edit/${course._id}`)}
                        className="p-1 text-on-surface-variant transition-colors hover:text-secondary dark:text-gray-400"
                        title="Edit Record"
                        aria-label={`Edit ${course.courseName}`}
                      >
                        <MdEdit className="text-xl" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(course)}
                        className="p-1 text-on-surface-variant transition-colors hover:text-error dark:text-gray-400"
                        title="Delete Record"
                        aria-label={`Delete ${course.courseName}`}
                      >
                        <MdDelete className="text-xl" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </div>
  );
}

export default CourseTable;
