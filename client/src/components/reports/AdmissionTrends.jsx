import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MdDownload } from "react-icons/md";

import { useTheme } from "../../context/useTheme";
import { chartColors } from "../dashboard/charts/chartTheme";

// Illustrative sample data — replace with real admissions data when available.
const admissionData = [
  { year: "2019", applications: 4800, acceptances: 3200 },
  { year: "2020", applications: 5100, acceptances: 3400 },
  { year: "2021", applications: 5600, acceptances: 3800 },
  { year: "2022", applications: 6200, acceptances: 4100 },
  { year: "2023", applications: 6800, acceptances: 4500 },
];

function handleCsvExport() {
  const headers = ["Year", "Applications", "Acceptances"];
  const csv = [headers, ...admissionData.map((d) => [d.year, d.applications, d.acceptances])]
    .map((row) => row.join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "admission-trends.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function AdmissionTrends() {
  const { darkMode } = useTheme();
  const c = chartColors(darkMode);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900 lg:col-span-2">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-primary dark:text-white">
            Admission Trends
          </h3>
          <p className="mt-1 text-[13px] text-on-surface-variant dark:text-gray-400">
            Applications vs Acceptances over 5 years
          </p>
        </div>
        <button
          onClick={handleCsvExport}
          className="flex items-center gap-1 rounded-lg p-2 text-sm text-secondary transition-colors hover:bg-surface-container dark:text-secondary-fixed-dim dark:hover:bg-gray-800"
        >
          <MdDownload className="text-sm" />
          <span className="text-xs font-semibold">CSV</span>
        </button>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={admissionData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
            <XAxis dataKey="year" tick={c.tick} axisLine={false} tickLine={false} interval={0} />
            <YAxis tick={c.tick} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip cursor={{ fill: c.cursorFill }} {...c.tooltip} />
            <Bar dataKey="applications" name="Applications" fill="#d8e2ff" radius={[6, 6, 0, 0]} maxBarSize={40} />
            <Bar dataKey="acceptances" name="Acceptances" fill="#0058be" radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex justify-center gap-4 text-xs font-semibold text-on-surface-variant dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-secondary-fixed" />
          Applications
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-secondary" />
          Acceptances
        </span>
      </div>
    </div>
  );
}

export default AdmissionTrends;
