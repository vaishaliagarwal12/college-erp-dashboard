import { useEffect, useState } from "react";
import { MdSchool, MdGroup, MdMenuBook, MdAccountBalance } from "react-icons/md";

import MetricCard from "../../components/dashboard/MetricCard";
import EnrollmentTrends from "../../components/dashboard/EnrollmentTrends";
import RecentActivity from "../../components/dashboard/RecentActivity";
import UpcomingEvents from "../../components/dashboard/UpcomingEvents";
import QuickActions from "../../components/dashboard/QuickActions";
import api from "../../services/api";

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  useEffect(() => {
    let active = true;

    api
      .get("/students", { params: { limit: 10000 } })
      .then((res) => {
        if (active) setStudents(res.data?.data || []);
      })
      .catch(() => {
        /* keep the list empty if the students API is unavailable */
      });

    api
      .get("/faculty")
      .then((res) => {
        if (active) setFacultyList(res.data?.data || []);
      })
      .catch(() => {
        /* keep the list empty if the faculty API is unavailable */
      });

    api
      .get("/courses")
      .then((res) => {
        if (active) setCoursesList(res.data?.data || []);
      })
      .catch(() => {
        /* keep the list empty if the courses API is unavailable */
      });

    api
      .get("/departments")
      .then((res) => {
        if (active && res.data?.data) setDepartmentsList(res.data.data);
      })
      .catch(() => {
        /* keep the list empty if the departments API is unavailable */
      });

    return () => {
      active = false;
    };
  }, []);

  const activeCourses = coursesList.filter((c) => c.status === "Active").length;
  const activeDepartments = departmentsList.filter(
    (d) => d.status === "Active"
  ).length;

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h2 className="text-[32px] font-bold leading-10 tracking-tight text-primary dark:text-white">
          Overview
        </h2>
        <p className="mt-1 text-on-surface-variant dark:text-gray-400">
          Key metrics and recent updates across the institution.
        </p>
      </div>

      {/* Global metrics – bento grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Students"
          value={students.length.toLocaleString()}
          icon={<MdSchool className="text-[18px]" />}
          trend="+5.2%"
          trendUp
        />
        <MetricCard
          label="Faculty"
          value={facultyList.length.toLocaleString()}
          icon={<MdGroup className="text-[18px]" />}
          trend="0%"
          neutral
          iconClass="bg-primary-fixed/20 text-primary dark:bg-primary-500/20 dark:text-primary-200"
        />
        <MetricCard
          label="Active Courses"
          value={activeCourses.toLocaleString()}
          icon={<MdMenuBook className="text-[18px]" />}
          trend="-2.1%"
          trendUp={false}
          iconClass="bg-primary-fixed/20 text-primary dark:bg-primary-500/20 dark:text-primary-200"
        />
        <MetricCard
          label="Departments"
          value={activeDepartments.toLocaleString()}
          icon={<MdAccountBalance className="text-[18px]" />}
          trend="+12.4%"
          trendUp
          iconClass="bg-tertiary-fixed-dim/30 text-tertiary-container dark:text-tertiary-fixed"
          decorative
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: chart + activity */}
        <div className="space-y-6 lg:col-span-2">
          <EnrollmentTrends />
          <RecentActivity />
        </div>

        {/* Right column: events + quick actions */}
        <div className="space-y-6">
          <UpcomingEvents />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
