import "dotenv/config";

const errors: string[] = [];
const warnings: string[] = [];

function read(name: string) {
  return process.env[name]?.trim() ?? "";
}

function checkRequired(name: string) {
  const value = read(name);

  if (!value) {
    errors.push(`${name} is missing.`);
    return "";
  }

  console.log(`${name}: set`);
  return value;
}

function checkUrl(name: string, value: string, protocols: string[]) {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (!protocols.includes(url.protocol)) {
      errors.push(`${name} must use one of these protocols: ${protocols.join(", ")}.`);
    }
  } catch {
    errors.push(`${name} is not a valid URL.`);
  }
}

function warn(message: string) {
  warnings.push(message);
}

const databaseUrl = checkRequired("DATABASE_URL");
const directUrl = checkRequired("DIRECT_URL");
const supabaseUrl = checkRequired("SUPABASE_URL");
const supabaseAnonKey = checkRequired("SUPABASE_ANON_KEY");
const deepSeekApiKey = checkRequired("DEEPSEEK_API_KEY");

checkUrl("DATABASE_URL", databaseUrl, ["postgresql:"]);
checkUrl("DIRECT_URL", directUrl, ["postgresql:"]);
checkUrl("SUPABASE_URL", supabaseUrl, ["https:"]);

if (supabaseUrl.includes("/rest/v1")) {
  errors.push("SUPABASE_URL must be the project base URL, not the /rest/v1 endpoint.");
}

if (databaseUrl && !databaseUrl.includes("pgbouncer=true")) {
  warn(
    "DATABASE_URL does not include pgbouncer=true. Supabase transaction pooling usually requires it.",
  );
}

if (databaseUrl && !databaseUrl.includes("connection_limit=")) {
  warn("DATABASE_URL does not include a connection_limit value.");
}

if (databaseUrl && !databaseUrl.includes("sslmode=require")) {
  warn("DATABASE_URL does not explicitly include sslmode=require.");
}

if (directUrl && !directUrl.includes("sslmode=require")) {
  warn("DIRECT_URL does not explicitly include sslmode=require.");
}

const serviceRoleKey = read("SUPABASE_SERVICE_ROLE_KEY");
console.log(
  `SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? "set" : "not set (optional at runtime)"}`,
);

const deepSeekBaseUrl = read("DEEPSEEK_BASE_URL");
console.log(`DEEPSEEK_BASE_URL: ${deepSeekBaseUrl || "default"}`);

if (deepSeekBaseUrl) {
  checkUrl("DEEPSEEK_BASE_URL", deepSeekBaseUrl, ["http:", "https:"]);
}

const deepSeekTimeout = read("DEEPSEEK_TIMEOUT_MS");

if (deepSeekTimeout) {
  const timeout = Number(deepSeekTimeout);

  if (!Number.isFinite(timeout) || timeout <= 0) {
    errors.push("DEEPSEEK_TIMEOUT_MS must be a positive number.");
  }
}

if (
  supabaseAnonKey &&
  serviceRoleKey &&
  (supabaseAnonKey.startsWith("sb_secret_") || supabaseAnonKey === serviceRoleKey)
) {
  errors.push("SUPABASE_ANON_KEY must not contain the Supabase secret key.");
}

if (deepSeekApiKey && !deepSeekApiKey.startsWith("sk-")) {
  warn("DEEPSEEK_API_KEY does not use the expected sk- prefix. Confirm the key type.");
}

for (const name of ["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD", "SEED_ADMIN_NAME"]) {
  console.log(`${name}: ${read(name) ? "set" : "not set (seed only)"}`);
}

if (warnings.length > 0) {
  console.warn("\nWarnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
  console.error("\nEnvironment check failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("\nEnvironment check passed.");
