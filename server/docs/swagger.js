const config = require("../config");

const apiSpec = {
  openapi: "3.0.3",
  info: {
    title: "College ERP API",
    version: "1.0.0",
    description:
      "REST API for the College ERP dashboard. All endpoints are versioned under /api/v1. " +
      "Authenticate with a Bearer access token obtained from /api/v1/auth/login.",
  },
  servers: [{ url: config.serverUrl, description: "API server" }],
  tags: [
    { name: "Auth", description: "Authentication, tokens, email verification, password reset, SSO" },
    { name: "Users", description: "User accounts and profile management" },
    { name: "Students", description: "Student records" },
    { name: "Faculty", description: "Faculty records" },
    { name: "Departments", description: "Department records" },
    { name: "Courses", description: "Course records" },
    { name: "Admissions", description: "Admission applications and approvals" },
    { name: "Attendance", description: "Attendance marking and reporting" },
    { name: "Exams", description: "Exam schedules" },
    { name: "Results", description: "Results and grading" },
    { name: "Timetable", description: "Class timetables" },
    { name: "Fees", description: "Fee structures and payments" },
    { name: "Curriculum", description: "Course syllabi" },
    { name: "Workload", description: "Faculty teaching allocation" },
    { name: "Notifications", description: "In-app + real-time notifications" },
    { name: "Files", description: "File uploads (GridFS)" },
    { name: "Jobs", description: "Background jobs (email, reminders, reports)" },
    { name: "Export", description: "CSV exports" },
    { name: "Analytics", description: "Dashboard analytics" },
    { name: "Audit", description: "Audit log" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["Admin", "Faculty", "Student"] },
          status: { type: "string", enum: ["Active", "Inactive", "Locked"] },
          emailVerified: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "number" },
          limit: { type: "number" },
          total: { type: "number" },
          pages: { type: "number" },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Tokens + public user" },
          "401": { $ref: "#/components/schemas/Error" },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        responses: {
          "201": { description: "User created" },
          "409": { $ref: "#/components/schemas/Error" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate the refresh token for a new access token",
        responses: { "200": { description: "New tokens" } },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout (revokes the refresh token)",
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/api/v1/auth/google": {
      get: {
        tags: ["Auth"],
        summary: "Start the Google SSO flow (302 redirect)",
        responses: { "302": { description: "Redirect to Google consent screen" } },
      },
    },
    "/api/v1/auth/google/callback": {
      get: {
        tags: ["Auth"],
        summary: "Google SSO callback",
        responses: { "200": { description: "Issues tokens" } },
      },
    },
    "/api/v1/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the current user's profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Profile" } },
      },
      put: {
        tags: ["Users"],
        summary: "Update the current user's profile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Updated profile" } },
      },
    },
    "/api/v1/students": {
      get: {
        tags: ["Students"],
        summary: "List students (search, filter, pagination)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Paginated student list",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
        },
      },
      post: {
        tags: ["Students"],
        summary: "Create a student (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" }, "409": { $ref: "#/components/schemas/Error" } },
      },
    },
    "/api/v1/students/{id}": {
      get: {
        tags: ["Students"],
        summary: "Get a student by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Student" }, "404": { $ref: "#/components/schemas/Error" } },
      },
      put: {
        tags: ["Students"],
        summary: "Update a student",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Students"],
        summary: "Delete a student (Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/api/v1/faculty": {
      get: {
        tags: ["Faculty"],
        summary: "List faculty",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Paginated faculty list" } },
      },
      post: {
        tags: ["Faculty"],
        summary: "Create a faculty member (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/faculty/{id}": {
      get: {
        tags: ["Faculty"],
        summary: "Get a faculty member by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Faculty" } },
      },
      put: {
        tags: ["Faculty"],
        summary: "Update a faculty member",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Faculty"],
        summary: "Delete a faculty member (Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/api/v1/departments": {
      get: {
        tags: ["Departments"],
        summary: "List departments with live student/faculty counts",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Department list" } },
      },
      post: {
        tags: ["Departments"],
        summary: "Create a department (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/departments/{id}": {
      get: {
        tags: ["Departments"],
        summary: "Get a department by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Department" } },
      },
      put: {
        tags: ["Departments"],
        summary: "Update a department",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Departments"],
        summary: "Delete a department",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/api/v1/courses": {
      get: {
        tags: ["Courses"],
        summary: "List courses",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Course list" } },
      },
      post: {
        tags: ["Courses"],
        summary: "Create a course (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/courses/{id}": {
      get: {
        tags: ["Courses"],
        summary: "Get a course by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Course" } },
      },
      put: {
        tags: ["Courses"],
        summary: "Update a course",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Updated" } },
      },
      delete: {
        tags: ["Courses"],
        summary: "Delete a course",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Deleted" } },
      },
    },
    "/api/v1/admissions": {
      get: {
        tags: ["Admissions"],
        summary: "List admission applications",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Application list" } },
      },
      post: {
        tags: ["Admissions"],
        summary: "Submit an admission application (Student)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Submitted" } },
      },
    },
    "/api/v1/admissions/mine": {
      get: {
        tags: ["Admissions"],
        summary: "Get the current student's applications",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Applications" } },
      },
    },
    "/api/v1/admissions/{id}/approve": {
      post: {
        tags: ["Admissions"],
        summary: "Approve an application (Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Approved, student created" } },
      },
    },
    "/api/v1/admissions/{id}/reject": {
      post: {
        tags: ["Admissions"],
        summary: "Reject an application (Admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Rejected" } },
      },
    },
    "/api/v1/attendance": {
      get: {
        tags: ["Attendance"],
        summary: "List attendance records",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Attendance list" } },
      },
      post: {
        tags: ["Attendance"],
        summary: "Mark attendance (Faculty/Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Recorded" } },
      },
    },
    "/api/v1/exams": {
      get: {
        tags: ["Exams"],
        summary: "List exams",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Exam list" } },
      },
      post: {
        tags: ["Exams"],
        summary: "Schedule an exam (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/results": {
      get: {
        tags: ["Results"],
        summary: "List results",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Result list" } },
      },
      post: {
        tags: ["Results"],
        summary: "Enter a result (Faculty/Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/timetable": {
      get: {
        tags: ["Timetable"],
        summary: "List timetable entries",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Timetable list" } },
      },
      post: {
        tags: ["Timetable"],
        summary: "Create a timetable entry (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/fees": {
      get: {
        tags: ["Fees"],
        summary: "List fee records",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Fee list" } },
      },
      post: {
        tags: ["Fees"],
        summary: "Create a fee record (Accounts/Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/fees/{id}/pay": {
      post: {
        tags: ["Fees"],
        summary: "Record a payment against a fee record",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Payment recorded" } },
      },
    },
    "/api/v1/curriculum": {
      get: {
        tags: ["Curriculum"],
        summary: "List course syllabi",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Syllabus list" } },
      },
      post: {
        tags: ["Curriculum"],
        summary: "Create a syllabus (Admin/Faculty)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/workload": {
      get: {
        tags: ["Workload"],
        summary: "List faculty workload allocations",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Allocation list" } },
      },
      post: {
        tags: ["Workload"],
        summary: "Allocate teaching load (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" }, "409": { $ref: "#/components/schemas/Error" } },
      },
    },
    "/api/v1/workload/summary": {
      get: {
        tags: ["Workload"],
        summary: "Aggregate workload across faculty and terms",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Aggregated summary" } },
      },
    },
    "/api/v1/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get the current user's notifications",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Notification list" } },
      },
      post: {
        tags: ["Notifications"],
        summary: "Create a notification (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/v1/notifications/unread-count": {
      get: {
        tags: ["Notifications"],
        summary: "Unread notification count",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Count" } },
      },
    },
    "/api/v1/files": {
      post: {
        tags: ["Files"],
        summary: "Upload a file (multipart/form-data)",
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Uploaded" } },
      },
      get: {
        tags: ["Files"],
        summary: "List uploaded files",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "File list" } },
      },
    },
    "/api/v1/jobs/health": {
      get: {
        tags: ["Jobs"],
        summary: "Queue backend status (redis-bullmq or in-memory)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Backend status" } },
      },
    },
    "/api/v1/jobs/fee-reminders": {
      post: {
        tags: ["Jobs"],
        summary: "Enqueue fee-due reminder emails (Admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  daysOverdue: { type: "number", default: 30 },
                  dryRun: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        responses: { "202": { description: "Enqueued" } },
      },
    },
    "/api/v1/jobs/reports/{type}": {
      post: {
        tags: ["Jobs"],
        summary: "Enqueue a CSV report generation job",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "type", in: "path", required: true, schema: { type: "string" } }],
        responses: { "202": { description: "Enqueued" } },
      },
    },
    "/api/v1/export/students": {
      get: {
        tags: ["Export"],
        summary: "Export students as CSV",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "CSV download" } },
      },
    },
    "/api/v1/export/faculty": {
      get: {
        tags: ["Export"],
        summary: "Export faculty as CSV",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "CSV download" } },
      },
    },
    "/api/v1/dashboard/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Aggregated dashboard analytics",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Analytics payload" } },
      },
    },
    "/api/v1/audit": {
      get: {
        tags: ["Audit"],
        summary: "List audit log entries (Admin)",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Audit log" } },
      },
    },
  },
};

module.exports = apiSpec;
