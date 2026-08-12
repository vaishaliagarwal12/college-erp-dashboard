const fs = require("fs");
const path = require("path");

async function ensureIndexes() {
  const modelsDir = path.join(__dirname, "..", "models");
  const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    const mod = require(path.join(modelsDir, file));
    const Model = mod.default || mod;
    if (Model?.modelName) {
      await Model.init();
    }
  }
}

module.exports = ensureIndexes;
