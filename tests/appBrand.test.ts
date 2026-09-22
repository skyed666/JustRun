import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("JustRun application branding", () => {
  test("uses JustRun for user-visible application surfaces", () => {
    expect(read("index.html")).toContain("<title>JustRun</title>");
    expect(read("index.html")).toContain('href="/justrun-logo.png"');
    expect(read("src-tauri/tauri.conf.json")).toContain('"productName": "JustRun"');
    expect(read("src-tauri/tauri.conf.json")).toContain('"title": "JustRun"');
    expect(read("src-tauri/tauri.conf.json")).toContain('"identifier": "com.justrun.app"');
    expect(read("src/components/layout/Sidebar.tsx")).toContain('src="/justrun-logo.png"');
    expect(read("src/components/layout/Sidebar.tsx")).toContain('className="brand-title">JustRun');
    expect(read("src/i18n/pages/common.ts")).toContain('"common.appName": "JustRun"');
    expect(read("src/lib/dialogs.ts")).toContain('title: "JustRun"');
    expect(read("src/pages/Settings.tsx")).toContain("<strong>JustRun</strong>");
  });
});
