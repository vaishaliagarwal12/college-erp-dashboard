const ROLES = {
  SUPER_ADMIN: "SuperAdmin",
  ADMIN: "Admin",
  REGISTRAR: "Registrar",
  ACCOUNTS: "Accounts",
  FACULTY: "Faculty",
  STUDENT: "Student",
};

const ROLE_LIST = Object.values(ROLES);

// Roles that are allowed to manage other users / access the admin surface
const STAFF_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.REGISTRAR,
  ROLES.ACCOUNTS,
];

module.exports = { ROLES, ROLE_LIST, STAFF_ROLES };
