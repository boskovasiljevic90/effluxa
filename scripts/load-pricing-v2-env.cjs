const fs = require("fs");

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return;

  const lines = fs.readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

    if (!match) continue;

    const key = match[1];

    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

/*
 * Match Next effective priority for this local test:
 * .env first, .env.local overrides.
 */
loadEnvFile(".env");
loadEnvFile(".env.local");
