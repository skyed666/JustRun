import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const authBuildKeys = [
  "RDC_AUTH_BASE_URL",
  "RDC_AUTH_EXECUTION_RELEASE_URL",
  "RDC_AUTH_PUBLIC_KEYS",
];

export function validateReleaseAuthConfig(env) {
  const rawRequired = (env.RDC_AUTH_REQUIRED ?? "").trim().toLowerCase();
  if (rawRequired && rawRequired !== "true" && rawRequired !== "false") {
    throw new Error("RDC_AUTH_REQUIRED must be true or false.");
  }

  if ((env.RDC_AUTH_SIGNING_KEY ?? "").trim()) {
    throw new Error(
      "The server signing key must never be present in the desktop build.",
    );
  }

  const required = rawRequired === "true";
  if (!required) {
    return {
      required: false,
      buildEnv: Object.fromEntries(authBuildKeys.map((key) => [key, ""])),
    };
  }

  const baseUrl = (env.RDC_AUTH_BASE_URL ?? "").trim();
  const publicKeys = (env.RDC_AUTH_PUBLIC_KEYS ?? "").trim();
  if (!baseUrl) {
    throw new Error(
      "RDC_AUTH_BASE_URL is required when RDC_AUTH_REQUIRED=true.",
    );
  }
  if (!publicKeys) {
    throw new Error(
      "RDC_AUTH_PUBLIC_KEYS is required when RDC_AUTH_REQUIRED=true.",
    );
  }

  const releaseUrl =
    (env.RDC_AUTH_EXECUTION_RELEASE_URL ?? "").trim() ||
    `${baseUrl.replace(/\/+$/, "")}/v1/execution-grants/release`;
  const buildEnv = {
    RDC_AUTH_BASE_URL: baseUrl,
    RDC_AUTH_EXECUTION_RELEASE_URL: releaseUrl,
    RDC_AUTH_PUBLIC_KEYS: publicKeys,
  };
  for (const [key, value] of Object.entries(buildEnv)) {
    if (/[\r\n\0]/.test(value)) {
      throw new Error(`${key} must be a single-line value.`);
    }
  }

  return { required: true, buildEnv };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const result = validateReleaseAuthConfig(process.env);
    if (process.env.GITHUB_ENV) {
      const lines = Object.entries(result.buildEnv).map(
        ([key, value]) => `${key}=${value}`,
      );
      appendFileSync(process.env.GITHUB_ENV, `${lines.join("\n")}\n`, "utf8");
    }
    console.log(
      result.required
        ? "Release authorization is enabled."
        : "Release authorization is disabled; protected QEMU operations will remain unavailable.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
