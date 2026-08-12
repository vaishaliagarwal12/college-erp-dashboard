const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const toCSV = (headers, rows) => {
  const headerLine = headers.map(escapeCsv).join(",");
  const lines = rows.map((row) => headers.map((h) => escapeCsv(row[h] ?? "")).join(","));
  return [headerLine, ...lines].join("\r\n");
};

const sendCSV = (res, filename, headers, rows) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCSV(headers, rows));
};

module.exports = { toCSV, sendCSV };
