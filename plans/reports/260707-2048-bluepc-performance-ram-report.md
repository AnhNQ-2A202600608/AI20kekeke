---
title: "BLUEPC Performance and RAM Report"
created: "2026-07-07 20:48"
source: "ck:research"
---

# BLUEPC Performance and RAM Report

## Summary

- Machine: `BLUEPC`, Lenovo `83K9`.
- CPU: AMD Ryzen 7 8745HS with Radeon 780M, 8C/16T class CPU.
- RAM visible now: `14.79GB`; free `6.71GB`; used `54.6%`.
- iGPU reserve: Radeon 780M reports `1GB` adapter RAM now.
- Main current RAM consumers: SQL Server, Defender, DWM/GPU stack, audio service, Codex, WebView/Edge, Lenovo/AMD utilities.
- Node/Next is no longer the RAM issue.

## Evidence

### Machine

| Field | Value |
|---|---|
| Computer name | BLUEPC |
| Manufacturer | LENOVO |
| Model | 83K9 |
| BIOS | QACN22WW |
| CPU | AMD Ryzen 7 8745HS w/ Radeon 780M Graphics |
| OS visible RAM | 14.79GB |
| Free RAM at sample | 6.71GB |

### Top Private Memory

| Process | Private MB | Notes |
|---|---:|---|
| sqlservr | 825 | SQL Server background service; biggest current item |
| MsMpEng | 423 | Microsoft Defender |
| dwm | 312 | Desktop Window Manager / GPU composition |
| audiodg | 258 | Windows audio engine |
| Codex | 241 | Codex renderer |
| ElevocControlService | 238 | Audio/noise control vendor service |
| Codex | 229 | Codex main/window process |
| Codex | 218 | Codex renderer/app process |
| msedgewebview2 | 150 | WebView background |

### Grouped Memory

| Group | Count | Private MB | Working Set MB |
|---|---:|---:|---:|
| Other | 162 | 3042 | 4412 |
| Browser/WebView | 23 | 987 | 1213 |
| Codex/OpenAI | 10 | 824 | 936 |
| AMD/GPU | 11 | 538 | 540 |
| MicrosoftApps | 8 | 455 | 1092 |
| Security | 4 | 443 | 468 |
| Dev/Node/Python | 4 | 48 | 92 |
| WindowsUpdate | 2 | 16 | 54 |

## Findings

1. RAM is currently healthy enough for 16GB-class laptop use: `54.6%` used after cleanup.
2. The earlier high memory was transient: Next dev/build, TiWorker, Windows Update stack.
3. Current biggest actionable background consumer is `sqlservr`, not Codex or Node.
4. Startup list includes items likely unnecessary for "watch films + code":
   - Docker Desktop
   - Apache Tomcat Monitor
   - Microsoft Copilot auto launch
   - Microsoft Edge auto launch
   - Wispr Flow
   - 9router
5. Radeon 780M uses system RAM for graphics. Current iGPU reserve is `1GB`, reasonable.

## Recommendations

### P0 - Immediate

- Disable startup apps not needed daily:
  - Docker Desktop
  - Apache Tomcat Monitor
  - Microsoft Copilot auto launch
  - Edge auto launch
  - Wispr Flow
  - 9router
- Stop SQL Server if not actively using local database.
- Keep Next dev off unless coding frontend.
- Use `pnpm dev:lowmem` instead of normal dev for this project.

### P1 - Windows Settings

- Enable Storage Sense.
- Disable background permissions for apps not needed.
- Keep Defender, but do not run repeated manual scans while coding.
- Set Power mode:
  - Plugged in/code: Best performance.
  - Battery/watch films: Balanced or Best power efficiency.

### P2 - Optional

- If not using local SQL Server, set service startup to Manual.
- If not using Docker daily, keep Docker Desktop startup disabled.
- If GPU memory pressure appears, keep UMA/iGPU memory at Auto or 1GB; avoid 2GB on 16GB RAM unless gaming/GPU-heavy work.

## Sources

- Microsoft Support: Tips to improve PC performance in Windows.
- Microsoft Support: Manage drive space with Storage Sense.
- Microsoft Learn Q&A: background apps/startup apps guidance.
- AMD official Ryzen 7 8845HS specifications.

## Unresolved Questions

- Whether `sqlservr` is required for your active workflow.
- Whether `9router` and `ElevocControlService` are intentionally installed and needed.

## Follow-up Optimization Applied

Timestamp: 2026-07-07 20:xx

### Startup Disabled

- `Docker Desktop`
- `ApacheTomcatMonitor10.1_Tomcat10`
- `MicrosoftCopilotAutoLaunch_293B7D33AA3D3DB20FCDDF8E6387F63D`
- `MicrosoftEdgeAutoLaunch_855B8B08037EA344FA06C7FE8A211328`
- `9router.vbs`
- `Wispr Flow.lnk`

Backup path:

```text
plans/reports/startup-backup-260707-optimization/
```

### Services Confirmed Stopped/Manual

- `MSSQLSERVER`
- `SQLTELEMETRY`
- `SQLWriter`
- `UltraViewService`
- `PCManager Service Store`
- `WSLService`
- `ElevocService`

### Remaining Startup Entries

- `RtkAudUService` - keep, Realtek audio tray/service.
- `SecurityHealth` - keep, Windows Security tray.

### After State

| Metric | Value |
|---|---:|
| Free RAM | 7.84GB |
| Used RAM | 6.95GB |
| Used percent | 47.0% |

### Notes

- `MSPCManager` app process may still be running until sign out/reboot, but its service is already Manual/Stopped.
- Edge/WebView processes can remain because Settings, widgets, Phone Link, PC Manager, or Codex WebView surfaces use WebView2.
- Reboot once to validate startup cleanup effect fully.

## Additional Best Practices Research

Timestamp: 2026-07-07

### Sources Checked

- Microsoft Support: Tips to improve PC performance in Windows.
- Microsoft Support: Configure Startup applications in Windows.
- Microsoft Support: Manage drive space with Storage Sense.
- Microsoft Learn Q&A: background apps/startup apps guidance.
- AMD official driver support page.
- AMD official Ryzen 7 8845HS specifications.
- Lenovo Intelligent Cooling documentation.

### Still Worth Doing

1. Keep Startup clean.
   - Current startup is good: only `RtkAudUService` and `SecurityHealth`.
   - Do not re-enable Docker, Edge auto-launch, Copilot auto-launch, Wispr Flow, or unknown scripts unless needed.

2. Use Windows power modes intentionally.
   - Coding plugged in: `Best performance`.
   - Watching films/battery: `Balanced` or `Best power efficiency`.
   - Avoid always-on extreme/performance thermal mode unless compiling heavily.

3. Keep Storage Sense enabled.
   - Microsoft recommends Storage Sense/temp cleanup for low disk/performance pressure.
   - Run manual cleanup after large builds: `.next`, temp files, old downloads.

4. Manage background app permissions.
   - Set unused Store apps to `Never` in background permissions.
   - Good candidates: Phone Link, Xbox overlay/apps, Copilot, Teams if unused.

5. Browser hygiene.
   - Edge/WebView currently consumes many small processes.
   - Enable sleeping tabs/efficiency mode in Edge if using it.
   - Remove unused extensions.

6. AMD/Lenovo drivers.
   - Keep AMD chipset/GPU driver current via AMD/Lenovo official tools.
   - Keep BIOS/chipset from Lenovo Vantage if stable, not beta/random driver packs.

7. Keep iGPU memory conservative.
   - For code + films, `Auto` or `1GB` UMA is better than 2GB+.
   - Increase only if gaming/GPU-heavy workloads need it.

### Maybe, Only If You Accept Trade-offs

- Set `WSearch` to Manual: saves background indexing, but Windows search gets slower.
- Disable Phone Link package/background: saves RAM if you do not use Android phone integration.
- Uninstall Microsoft PC Manager: you already stopped service; app process may remain until reboot.
- Disable Xbox Game Bar/overlay if not gaming/recording.

### Avoid

- Do not disable Defender permanently.
- Do not disable DWM.
- Do not disable WMI.
- Do not use random "RAM cleaner" tools as a real fix.
- Do not set msconfig max memory; that limits usable RAM and hurts performance.

## Background App Permissions Disabled

Timestamp: 2026-07-07

Disabled background access for:

- `Microsoft.YourPhone_8wekyb3d8bbwe` - Phone Link.
- `Microsoft.XboxGamingOverlay_8wekyb3d8bbwe` - Xbox Game Bar overlay.
- `Microsoft.XboxIdentityProvider_8wekyb3d8bbwe` - Xbox identity provider.
- `Microsoft.XboxGameCallableUI_cw5n1h2txyewy` - Xbox callable UI.
- `MSTeams_8wekyb3d8bbwe` - Microsoft Teams.

Registry path used:

```text
HKCU\Software\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications\<PackageFamilyName>
```

Values applied:

```text
Disabled=1
DisabledByUser=1
```

Also stopped the currently running `PhoneExperienceHost` process. Follow-up process check found no matching Phone Link, Teams, Xbox, Game Bar, or Copilot background processes running.

## CPU Stability Check

Timestamp: 2026-07-07

### Findings

- Active power plan: `Balanced`.
- CPU: AMD Ryzen 7 8745HS, 8 cores / 16 logical processors.
- Processor queue length was `0` during the first check, so there was no CPU backlog.
- Background services/processes were not the main source of CPU variance:
  - `SearchHost` used about `0.6%` of one core over a 10-second delta sample.
  - Defender, Radeon, WebView, and Windows Update-related target processes were near `0` CPU in the same sample.
- The main observed CPU movement during diagnostics came from `Taskmgr`, `Codex`, and the PowerShell measurement commands themselves.

### Power Plan Optimization Applied

Changed processor minimum state on the active Balanced plan:

```text
AC minimum processor state: 80% -> 5%
DC minimum processor state: 5% -> 5%
Maximum processor state: unchanged at 100%
```

Command used:

```powershell
powercfg /setacvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
powercfg /setdcvalueindex SCHEME_CURRENT SUB_PROCESSOR PROCTHROTTLEMIN 5
powercfg /setactive SCHEME_CURRENT
```

### After State

10-second CPU sample after the change:

| Metric | Value |
|---|---:|
| Average CPU | 11.9% |
| Minimum CPU | 5.4% |
| Maximum CPU | 17.9% |
| RAM used | 5.64GB |
| RAM used percent | 38.2% |

This keeps CPU boost available for builds because maximum processor state remains `100%`, but allows the CPU to idle lower when watching films, browsing, or coding lightly.
