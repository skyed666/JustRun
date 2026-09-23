import test from "node:test";
import assert from "node:assert/strict";

import { validateReleaseAuthConfig } from "./check-release-auth-config.mjs";

test("defaults to no-auth mode and clears authorization build values", () => {
  assert.deepEqual(
    validateReleaseAuthConfig({
      RDC_AUTH_BASE_URL: "",
      RDC_AUTH_EXECUTION_RELEASE_URL: "/v1/execution-grants/release",
      RDC_AUTH_PUBLIC_KEYS: "",
    }),
    {
      required: false,
      buildEnv: {
        RDC_AUTH_BASE_URL: "",
        RDC_AUTH_EXECUTION_RELEASE_URL: "",
        RDC_AUTH_PUBLIC_KEYS: "",
      },
    },
  );
});

test("keeps configured public values when authorization is enabled", () => {
  assert.deepEqual(
    validateReleaseAuthConfig({
      RDC_AUTH_REQUIRED: "true",
      RDC_AUTH_BASE_URL: "https://auth.example.test",
      RDC_AUTH_EXECUTION_RELEASE_URL: "",
      RDC_AUTH_PUBLIC_KEYS: "key-1=public-key",
    }),
    {
      required: true,
      buildEnv: {
        RDC_AUTH_BASE_URL: "https://auth.example.test",
        RDC_AUTH_EXECUTION_RELEASE_URL:
          "https://auth.example.test/v1/execution-grants/release",
        RDC_AUTH_PUBLIC_KEYS: "key-1=public-key",
      },
    },
  );
});

test("rejects enabled authorization when required public configuration is missing", () => {
  assert.throws(
    () =>
      validateReleaseAuthConfig({
        RDC_AUTH_REQUIRED: "true",
        RDC_AUTH_BASE_URL: "https://auth.example.test",
        RDC_AUTH_PUBLIC_KEYS: "",
      }),
    /RDC_AUTH_PUBLIC_KEYS/,
  );
});

test("rejects invalid toggle values rather than silently disabling authorization", () => {
  assert.throws(
    () => validateReleaseAuthConfig({ RDC_AUTH_REQUIRED: "yes" }),
    /RDC_AUTH_REQUIRED must be true or false/,
  );
});

test("rejects a server signing key in both modes", () => {
  assert.throws(
    () =>
      validateReleaseAuthConfig({
        RDC_AUTH_REQUIRED: "false",
        RDC_AUTH_SIGNING_KEY: "must-not-be-in-desktop-build",
      }),
    /server signing key must never be present/,
  );
});
