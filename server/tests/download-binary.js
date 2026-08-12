// One-off helper: pre-downloads the mongod binary used by tests so
// `npm test` doesn't stall on the first run.
const { MongoBinary } = require("mongodb-memory-server");

process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || "7.0.14";

MongoBinary.getPath().then((path) => {
  console.log(`mongod binary ready at: ${path}`);
  process.exit(0);
}).catch((err) => {
  console.error("Download failed:", err.message);
  process.exit(1);
});
