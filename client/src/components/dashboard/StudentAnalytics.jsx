import { useState, useEffect, useMemo, useRef } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaHome,
  FaChevronRight,
  FaUsers,
  FaBriefcase,
  FaLaptopCode,
  FaPalette,
  FaChartPie,
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useTheme } from "../../context/useTheme";
import EmptyState from "../ui/EmptyState";
import { PALETTE, chartColors } from "./charts/chartTheme";

const YEAR_LABELS = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

const PROGRAM_ICONS = {
  "B.Tech": <FaLaptopCode className="text-xl" />,
  BBA: <FaBriefcase className="text-xl" />,
  "B.Des": <FaPalette className="text-xl" />,
};

function yearOf(semester) {
  return semester ? Math.ceil(Number(semester) / 2) : 0;
}

function yearBreakdown(list) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  list.forEach((s) => {
    const y = yearOf(s.semester);
    if (y >= 1 && y <= 4) counts[y] += 1;
  });
  return [1, 2, 3, 4].map((y) => ({
    name: YEAR_LABELS[y] || `${y}th Year`,
    students: counts[y],
    label: `Year ${y}`,
  }));
}

function SeriesLegend({ data }) {
  return (
    <ul className="space-y-2">
      {data.map((entry, index) => {
        const total = data.reduce((sum, d) => sum + d.value, 0);
        const pct = total ? Math.round((entry.value / total) * 100) : 0;
        return (
          <li key={entry.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color || PALETTE[index % PALETTE.length] }}
            />
            <span className="flex-1 truncate text-gray-600 dark:text-gray-300">
              {entry.name}
            </span>
            <span className="font-semibold text-gray-900 tabular-nums dark:text-white">
              {entry.value}
            </span>
            <span className="w-9 text-right text-gray-400 tabular-nums">
              {pct}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Donut({ data, title, dark }) {
  const c = chartColors(dark);
  return (
    <div className="flex h-full flex-col">
      <h3 className="section-title">{title}</h3>
      <div className="relative min-h-[220px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color || PALETTE[index % PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip {...c.tooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900 tabular-nums dark:text-white">
            {data.reduce((s, d) => s + d.value, 0)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">students</span>
        </div>
      </div>
      <SeriesLegend data={data} />
    </div>
  );
}

function YearBar({ data, title, dark }) {
  const c = chartColors(dark);
  const total = data.reduce((s, d) => s + d.students, 0);

  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-2">
        <h3 className="section-title">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total} students
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={c.grid} />
          <XAxis
            dataKey="name"
            tick={c.tick}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis tick={c.tick} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: c.cursorFill }} {...c.tooltip} />
          <Bar dataKey="students" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={PALETTE[index % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TransitionSpinner() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
      <span className="spinner" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading analytics…</p>
    </div>
  );
}

function ProgramLevel({ programs, programData, total, onOpenProgram }) {
  const { darkMode } = useTheme();
  const dark = darkMode;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="flex flex-col gap-3 lg:col-span-3">
        {programs.length === 0 ? (
          <EmptyState
            message="No student programs found"
            hint="Add student records to see distribution analytics."
          />
        ) : (
          programs.map((p, i) => {
            const count = programData[i]?.value ?? 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            const color = PALETTE[i % PALETTE.length];
            return (
              <button
                key={p}
                onClick={() => onOpenProgram(p)}
                title={`${count} students · drill into ${p}`}
                className="card card-hover group flex w-full items-center gap-4 p-4 text-left"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: color }}
                >
                  {PROGRAM_ICONS[p] || <FaUsers className="text-xl" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-gray-900 dark:text-white">
                      {p}
                    </span>
                    <span className="text-xl font-bold text-gray-900 tabular-nums dark:text-white">
                      {count}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums dark:text-gray-400">
                      {pct}%
                    </span>
                  </div>
                </div>

                <FaArrowRight className="shrink-0 text-gray-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary-500 dark:text-gray-600" />
              </button>
            );
          })
        )}
      </div>

      <div className="lg:col-span-2">
        <Donut data={programData} title="Students by Program" dark={dark} />
      </div>
    </div>
  );
}

function BranchLevel({ program, branchData, totalInProgram, onOpenBranch }) {
  const { darkMode } = useTheme();
  const dark = darkMode;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="flex flex-col gap-3 lg:col-span-3">
        {branchData.length === 0 ? (
          <EmptyState
            message="No branches found"
            hint={`No branch data is recorded for ${program}.`}
          />
        ) : (
          branchData.map((entry) => {
            const pct = totalInProgram ? Math.round((entry.value / totalInProgram) * 100) : 0;
            return (
              <button
                key={entry.name}
                onClick={() => onOpenBranch(entry.name)}
                title={`${entry.value} students · drill into ${entry.name}`}
                className="card card-hover group flex w-full items-center gap-4 p-4 text-left"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: entry.color }}
                >
                  {entry.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-gray-900 dark:text-white">
                      {entry.name}
                    </span>
                    <span className="text-xl font-bold text-gray-900 tabular-nums dark:text-white">
                      {entry.value}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: entry.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 tabular-nums dark:text-gray-400">
                      {pct}%
                    </span>
                  </div>
                </div>

                <FaArrowRight className="shrink-0 text-gray-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary-500 dark:text-gray-600" />
              </button>
            );
          })
        )}
      </div>

      <div className="lg:col-span-2">
        <Donut data={branchData} title={`${program} Students by Branch`} dark={dark} />
      </div>
    </div>
  );
}

function YearLevel({ currentFilter, yearData }) {
  const { darkMode } = useTheme();
  const dark = darkMode;

  if (currentFilter.length === 0) {
    return (
      <EmptyState
        message="No students found"
        hint="There are no student records matching this selection."
      />
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="flex flex-col gap-3 lg:col-span-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {yearData.map((entry, index) => (
            <div
              key={entry.label}
              className="card card-hover flex items-center gap-4 p-4"
              title={`${entry.students} students in ${entry.name}`}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              >
                {index + 1}
              </div>
              <div>
                <p className="stat-label">{entry.name}</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums dark:text-white">
                  {entry.students}
                  <span className="ml-1 text-xs font-medium text-gray-400">
                    students
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tip: academic year is derived from each student's current semester.
        </p>
      </div>

      <div className="lg:col-span-2">
        <YearBar
          data={yearData}
          title="Student Distribution by Academic Year"
          dark={dark}
        />
      </div>
    </div>
  );
}

function StudentAnalytics({ students = [] }) {
  const timerRef = useRef(null);

  const [program, setProgram] = useState(null);
  const [branch, setBranch] = useState(null);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const total = students.length;

  const programs = useMemo(() => {
    const preferred = ["B.Tech", "BBA", "B.Des"];
    const present = Array.from(new Set(students.map((s) => s.course))).filter(Boolean);
    const ordered = preferred.filter((p) => present.includes(p));
    present.forEach((p) => {
      if (!ordered.includes(p)) ordered.push(p);
    });
    return ordered;
  }, [students]);

  const branches = useMemo(() => {
    if (!program) return [];
    return Array.from(
      new Set(
        students
          .filter((s) => s.course === program)
          .map((s) => s.branch)
          .filter(Boolean)
      )
    );
  }, [program, students]);

  const hasBranchLevel = branches.length > 0;

  const programData = programs.map((p, i) => ({
    name: p,
    value: students.filter((s) => s.course === p).length,
    color: PALETTE[i % PALETTE.length],
  }));

  const branchData = branches.map((b, i) => ({
    name: b,
    value: students.filter((s) => s.course === program && s.branch === b).length,
    color: PALETTE[i % PALETTE.length],
  }));

  const totalInProgram = program
    ? students.filter((s) => s.course === program).length
    : 0;

  const currentFilter = useMemo(() => {
    return students.filter(
      (s) =>
        (!program || s.course === program) &&
        (!branch || s.branch === branch)
    );
  }, [program, branch, students]);

  const yearData = yearBreakdown(currentFilter);

  const drill = (next) => {
    setTransitioning(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      next();
      setTransitioning(false);
    }, 320);
  };

  const openProgram = (p) =>
    drill(() => {
      setBranch(null);
      setProgram(p);
    });

  const openBranch = (b) => drill(() => setBranch(b));

  const goBack = () =>
    drill(() => {
      if (branch) setBranch(null);
      else setProgram(null);
    });

  const resetAll = () =>
    drill(() => {
      setBranch(null);
      setProgram(null);
    });

  const crumbRoot = (
    <button
      onClick={resetAll}
      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
    >
      Students
    </button>
  );

  const crumbs = (() => {
    const items = [crumbRoot];
    if (program) {
      items.push(
        <FaChevronRight key="sep1" className="h-3 w-3 text-gray-300 dark:text-gray-600" />
      );
      items.push(
        <button
          key="program"
          onClick={goBack}
          className="rounded-md px-1.5 py-0.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {program}
        </button>
      );
    }
    if (branch) {
      items.push(
        <FaChevronRight key="sep2" className="h-3 w-3 text-gray-300 dark:text-gray-600" />
      );
      items.push(
        <span key="branch" className="rounded-md px-1.5 py-0.5 font-medium text-gray-400 dark:text-gray-500">
          {branch}
        </span>
      );
    }
    return items;
  })();

  const viewKey = `${program || "all"}:${branch || "all"}`;

  return (
    <div className="card">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <FaChartPie className="text-xl" />
          </div>
          <div>
            <h2 className="section-title">Student Distribution</h2>
            <p className="section-subtitle">
              Explore how students are distributed across programs, branches and years.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          {crumbs}
        </nav>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button onClick={goBack} className="btn-secondary" disabled={!program}>
          <FaArrowLeft />
          Back
        </button>

        <div className="flex items-center gap-2">
          {program && (
            <button onClick={resetAll} className="btn-ghost" title="Back to all programs">
              <FaHome />
              <span className="hidden sm:inline">All Programs</span>
            </button>
          )}
          <span className="chip bg-primary-50 text-primary-700 ring-primary-600/15 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-400/20">
            <FaUsers className="h-3 w-3" />
            {programData.reduce((s, d) => s + d.value, 0)} students
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {transitioning ? (
          <TransitionSpinner />
        ) : (
          <div key={viewKey} className="animate-slide-up">
            {!program && (
              <ProgramLevel
                programs={programs}
                programData={programData}
                total={total}
                onOpenProgram={openProgram}
              />
            )}
            {program && !branch && hasBranchLevel && (
              <BranchLevel
                program={program}
                branchData={branchData}
                totalInProgram={totalInProgram}
                onOpenBranch={openBranch}
              />
            )}
            {program && !branch && !hasBranchLevel && (
              <YearLevel currentFilter={currentFilter} yearData={yearData} />
            )}
            {program && branch && (
              <YearLevel currentFilter={currentFilter} yearData={yearData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAnalytics;