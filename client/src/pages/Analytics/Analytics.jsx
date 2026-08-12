import { useQuery } from '@tanstack/react-query'
import { getDashboardAnalytics } from '../../api'

function BarChart({ data, valueKey, labelKey, format }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div className="flex items-end gap-3 h-48">
      {data.map((d) => (
        <div key={d[labelKey]} className="flex-1 flex flex-col items-center justify-end gap-1">
          <span className="text-xs text-gray-600">{format(d[valueKey])}</span>
          <div
            className="w-full bg-blue-500 rounded-t"
            style={{ height: `${Math.round((d[valueKey] / max) * 140)}px` }}
            title={`${d[labelKey]}: ${format(d[valueKey])}`}
          />
          <span className="text-[10px] text-gray-500 truncate w-full text-center">{d[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: getDashboardAnalytics,
  })

  if (isLoading) {
    return <p className="text-gray-500">Loading analytics...</p>
  }

  if (error) {
    return (
      <p className="text-red-500">
        Failed to load analytics: {error.response?.data?.message || error.message}
      </p>
    )
  }

  const a = data?.data || {}
  const perf = a.performance || {}
  const gradeTotal = a.gradeDistribution?.reduce((sum, g) => sum + g.count, 0) || 0
  const deptTotal = a.studentsByDepartment?.reduce((sum, d) => sum + d.count, 0) || 0

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Avg. Score</p>
          <p className="text-3xl font-bold mt-1">{perf.averagePercentage ?? 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Pass Rate</p>
          <p className="text-3xl font-bold mt-1">{perf.passRate ?? 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Results Graded</p>
          <p className="text-3xl font-bold mt-1">{perf.totalResults ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Attendance Trend (monthly %)</h2>
          {(a.attendanceTrend || []).length ? (
            <BarChart
              data={a.attendanceTrend}
              valueKey="percentage"
              labelKey="month"
              format={(v) => `${v}%`}
            />
          ) : (
            <p className="text-gray-400 text-sm">No attendance data yet.</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Fee Collection (monthly ₹)</h2>
          {(a.feeTrend || []).length ? (
            <BarChart
              data={a.feeTrend}
              valueKey="collected"
              labelKey="month"
              format={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v)}
            />
          ) : (
            <p className="text-gray-400 text-sm">No fee data yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Grade Distribution</h2>
          {(a.gradeDistribution || []).length ? (
            <div className="flex flex-col gap-2">
              {a.gradeDistribution.map((g) => (
                <div key={g.grade} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-medium">{g.grade}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${gradeTotal ? Math.round((g.count / gradeTotal) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-gray-600">{g.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No results yet.</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Students by Department</h2>
          {(a.studentsByDepartment || []).length ? (
            <div className="flex flex-col gap-2">
              {a.studentsByDepartment.map((d) => (
                <div key={d.department} className="flex items-center gap-3">
                  <span className="w-40 text-sm font-medium truncate">{d.department}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full"
                      style={{ width: `${deptTotal ? Math.round((d.count / deptTotal) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm text-gray-600">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No students yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics
