import { useEffect, useMemo, useState } from "react";
import {
  MdSchool,
  MdAnalytics,
  MdGroup,
  MdPayments,
  MdCalendarMonth,
  MdExpandMore,
  MdDownload,
  MdTrendingUp,
  MdTrendingFlat,
  MdTrendingDown,
  MdRedo,
} from "react-icons/md";

import AdmissionTrends from "../../components/reports/AdmissionTrends";
import StudentsByDept from "../../components/reports/StudentsByDept";
import DepartmentPerformance from "../../components/reports/DepartmentPerformance";
import EmptyState from "../../components/ui/EmptyState";
import api, { getErrorMessage } from "../../services/api";

function KpiCard({ label, icon, value, trend, trendType = "up", note }) {
  const trendContent = {
    up: (
      <>
        <MdTrendingUp className="text-emerald-600" />
        <span className="font-medium text-emerald-600">{trend}</span>
      </>
    ),
    down: (
      <>
        <MdTrendingDown className="text-rose-600" />
        <span className="font-medium text-rose-600">{trend}</span>
      </>
    ),
    flat: (
      <>
        <MdTrendingFlat className="text-amber-600" />
        <span className="font-medium text-amber-600">{trend}</span>
      </>
    ),
  }[trendType];

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0px_1px_3px_rgba(0,0,0,0.05),0px_10px_15px_-3px_rgba(0,0,0,0.02)] dark:border-gray-700/60 dark:bg-gray-900">
      <div className="mb-4 flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant dark:text-gray-400">
          {label}
        </p>
        <span className="text-xl text-secondary dark:text-secondary-fixed-dim">
          {icon}
        </span>
      </div>
      <p className="text-2xl font-semibold text-primary tabular-nums dark:text-white">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-1 text-sm">
        {trendContent}
        <span className="text-on-surface-variant dark:text-gray-400">{note}</span>
      </div>
    </div>
  );
}

function Reports() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = () => {
    api
      .get("/students", { params: { limit: 10000 } })
      .then((res) => setStudents(res.data?.data || []))
      .catch((err) => {
        setError(getErrorMessage(err, "Unable to load reports."));
      });

    api
      .get("/departments")
      .then((res) => setDepartments(res.data?.data || []))
      .catch(() => {});

    api
      .get("/courses", { params: { limit: 10000 } })
      .then((res) => setCourses(res.data?.data || []))
      .catch(() => {});

    api
      .get("/faculty")
      .then((res) => setFaculty(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const retryLoad = () => {
    setLoading(true);
    setError("");
    fetchData();
  };

  const studentsByDept = useMemo(() => {
    const map = {};
    students.forEach((s) => {
      const name = s.department || s.course || "Unassigned";
      if (!map[name]) map[name] = { name, value: 0 };
      map[name].value += 1;
    });
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [students]);

  const deptRows = useMemo(() => {
    return departments
      .map((d) => {
        const name = d.departmentName || d.name || "";
        const enrolled = students.filter(
          (s) => (s.department || s.course) === name
        ).length;
        const deptFaculty = faculty.filter((f) => f.department === name).length;
        const activeCourses = courses.filter(
          (c) => c.department === name && c.status === "Active"
        ).length;
        return {
          name,
          enrolled: enrolled || d.totalStudents || 0,
          faculty: deptFaculty || d.totalFaculty || 0,
          courses: activeCourses,
        };
      })
      .filter((row) => row.name);
  }, [departments, students, faculty, courses]);

  const ratio =
    students.length && faculty.length
      ? `1:${Math.max(1, Math.round(students.length / faculty.length))}`
      : "—";

  const kpis = [
    {
      label: "Total Enrollment",
      icon: <MdSchool />,
      value: students.length.toLocaleString(),
      trend: "+4.2%",
      note: "vs last year",
    },
    // Illustrative — the app has no grade data yet.
    {
      label: "Average GPA",
      icon: <MdAnalytics />,
      value: "3.42",
      trend: "+0.1",
      note: "vs last semester",
    },
    {
      label: "Faculty to Student",
      icon: <MdGroup />,
      value: ratio,
      trend: "No change",
      trendType: "flat",
      note: "target 1:15",
    },
    // Illustrative — no tuition/finance module exists yet.
    {
      label: "Revenue (Tuition)",
      icon: <MdPayments />,
      value: "$42.5M",
      trend: "+8.5%",
      note: "vs last year",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-[32px] font-bold leading-10 tracking-tight text-primary dark:text-white">
            Reports &amp; Analytics
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant dark:text-gray-400">
            Key performance metrics across departments and academic terms.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm text-on-surface shadow-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200">
            <MdCalendarMonth className="text-on-surface-variant dark:text-gray-400" />
            <span>Fall Semester 2023</span>
            <MdExpandMore className="text-on-surface-variant dark:text-gray-400" />
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-xs font-semibold text-on-secondary shadow-sm transition-colors hover:bg-secondary-container active:scale-[0.98]"
          >
            <MdDownload />
            Export PDF
          </button>
        </div>
      </div>

      {/* Loading / error states */}
      {loading ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3">
            <span className="spinner" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading reports…
            </p>
          </div>
        </div>
      ) : error && students.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-card dark:border-gray-700/60 dark:bg-gray-900">
          <EmptyState message="Could not load reports" hint={error} />
          <div className="flex justify-center pb-6">
            <button onClick={retryLoad} className="btn-secondary">
              <MdRedo />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} {...kpi} />
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <AdmissionTrends />
            <StudentsByDept data={studentsByDept} />
          </div>

          {/* Department table */}
          <DepartmentPerformance rows={deptRows} />
        </>
      )}
    </div>
  );
}

export default Reports;
