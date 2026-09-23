#![cfg_attr(windows, windows_subsystem = "windows")]

#[cfg(windows)]
mod windows_background_processes {
    use std::path::Path;
    use std::time::Duration;

    use justrun_lib::services::{qemu, util};

    const CONSOLE_WINDOW_PROBE: &str = "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class ConsoleWindowProbe { [DllImport(\"kernel32.dll\")] public static extern IntPtr GetConsoleWindow(); }'; [ConsoleWindowProbe]::GetConsoleWindow().ToInt64(); [Console]::Error.Write('probe-stderr')";

    #[test]
    fn util_captured_process_has_no_console_window() {
        let result = util::run_command_timeout(
            "powershell.exe",
            &[
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                CONSOLE_WINDOW_PROBE,
            ],
            Duration::from_secs(10),
        );

        assert!(result.success, "PowerShell probe failed: {result:?}");
        assert_eq!(
            result.stdout, "0",
            "child console window handle was not zero"
        );
        assert_eq!(result.stderr, "probe-stderr");
    }

    #[test]
    fn qemu_captured_process_has_no_console_window() {
        let output = qemu::run_cli_at(
            Path::new("powershell.exe"),
            &[
                "-NoLogo".into(),
                "-NoProfile".into(),
                "-NonInteractive".into(),
                "-Command".into(),
                CONSOLE_WINDOW_PROBE.into(),
            ],
            Duration::from_secs(10),
        )
        .expect("PowerShell probe should run");

        assert!(output.success, "PowerShell probe failed: {output:?}");
        assert_eq!(
            output.stdout, "0",
            "child console window handle was not zero"
        );
        assert_eq!(output.stderr, "probe-stderr");
    }
}
