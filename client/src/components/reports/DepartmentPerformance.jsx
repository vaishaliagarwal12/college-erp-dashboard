import { MdTrendingUp, MdTrendingFlat, MdTrendingDown } from "react-icons/md";
import { useNavigate } from "react-router-dom";

const trendCycle = [
  { icon: <MdTrendingUp className="text-emerald-600" />, label: "up" },
  { icon: <MdTrendingUp className="text-emerald-600" />, label: "up" },
  { icon: <MdTrendingFlat className="text-amber-600" />, label: "flat" },
  { icon: <MdTrendingDown className="text-rose-600" />, label: "down" },
];

function DepartmentPerformance({ rows = [] }) {
  const navigate = useNavigate();

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6 py-5 dark:border-gray-700/60 dark:bg-gray-900">
        <div>
          <h3 className="text-xl font-semibold text-primary dark:text-white">
            Department Performance
          </h3>
          <p className="mt-1 text-[13px] text-on-surface-variant dark:text-gray-400">
            Detailed breakdown of key metrics by department
          </p>
        </div>
        <button
          onClick={() => navigate("/departments")}
          className="rounded-lg border border-secondary px-4 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-secondary-fixed dark:border-secondary-fixed-dim dark:text-secondary-fixed-dim dark:hover:bg-primary-container"
        >
          View All Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-outline-variant bg-[#f1f5f9] text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:border-gray-700/60 dark:bg-gray-800/70 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Enrolled</th>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Active Courses</th>
              <th className="px-4 py-3 text-right">Trend</th>
            </tr>
          </thead>

          <tbody className="text-sm text-on-surface dark:text-gray-200">
            {rows.map((row, index) => (
              <tr
                key={row.name}
                className="border-b border-outline-variant transition-colors last:border-none hover:bg-surface-container-low dark:border-gray-700/60 dark:hover:bg-gray-800/60"
              >
                <td className="px-4 py-4 font-medium text-primary dark:text-gray-100">
                  {row.name}
                </td>
                <td className="px-4 py-4 font-medium text-on-surface-variant tabular-nums dark:text-gray-400">
                  {row.enrolled.toLocaleString()}
                </td>
                <td className="px-4 py-4 font-medium text-on-surface-variant tabular-nums dark:text-gray-400">
                  {row.faculty}
                </td>
                <td className="px-4 py-4 font-medium text-on-surface-variant tabular-nums dark:text-gray-400">
                  {row.courses}
                </td>
                <td className="px-4 py-4 text-right">
                  {trendCycle[index % trendCycle.length].icon}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DepartmentPerformance;
