import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { MdMoreVert } from "react-icons/md";

import { useTheme } from "../../context/useTheme";
import { chartColors } from "../dashboard/charts/chartTheme";

const DONUT_COLORS = ["#0058be", "#2170e4", "#ddc39d", "#8b5cf6", "#10b981"];

function StudentsByDept({ data = [] }) {
  const { darkMode } = useTheme();
  const c = chartColors(darkMode);
  const colored = data.map((d, index) => ({
    ...d,
    color: DONUT_COLORS[index % DONUT_COLORS.length],
  }));
  const total = colored.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-primary dark:text-white">
          Students by Department
        </h3>
        <button className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container dark:text-gray-400 dark:hover:bg-gray-800">
          <MdMoreVert />
        </button>
      </div>

      <div className="relative mx-auto mb-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
            >
              {colored.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip {...c.tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary tabular-nums dark:text-white">
            {total.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-on-surface-variant dark:text-gray-400">
            students
          </span>
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {colored.map((entry) => {
          const pct = total ? Math.round((entry.value / total) * 100) : 0;
          return (
            <li
              key={entry.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 text-on-surface dark:text-gray-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}
              </span>
              <span className="text-sm font-medium text-on-surface-variant tabular-nums dark:text-gray-400">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default StudentsByDept;
