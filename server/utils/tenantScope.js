// Builds the tenant isolation filter for queries. Returns an empty object in
// single-tenant mode so behaviour is unchanged when no tenant is configured.
const tenantScope = (req) => (req.tenantId ? { tenantId: req.tenantId } : {});

// Spreads the tenant id onto a document on create when in tenant mode.
const tenantCreate = (req) => (req.tenantId ? { tenantId: req.tenantId } : {});

module.exports = { tenantScope, tenantCreate };
