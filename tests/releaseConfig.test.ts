import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readJson = (relativePath: string) =>
  JSON.parse(readFileSync(resolve(process.cwd(), relativePath), "utf8")) as {
    bundle?: { resources?: Record<string, string> };
  };

describe("Tauri release resource overlays", () => {
  it("keeps the base config free of a platform-specific qemu-center executable", () => {
    const base = readJson("src-tauri/tauri.conf.json");

    expect(base.bundle?.resources ?? {}).not.toHaveProperty(
      "../qemu-center/target/release/qemu-center.exe",
    );
  });

  it("maps the Windows qemu-center release resource to the Windows package path", () => {
    const windows = readJson("src-tauri/tauri.windows.conf.json");

    expect(windows.bundle?.resources).toEqual({
      "../qemu-center/target/release/qemu-center.exe": "qemu-center/qemu-center.exe",
    });
  });

  it("maps the Linux qemu-center release resource to the Linux package path", () => {
    const linux = readJson("src-tauri/tauri.linux.conf.json");

    expect(linux.bundle?.resources).toEqual({
      "../qemu-center/target/release/qemu-center": "qemu-center/qemu-center",
    });
  });
});
