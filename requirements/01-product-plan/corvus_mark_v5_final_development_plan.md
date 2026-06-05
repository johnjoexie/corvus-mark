# Corvus Mark v5.0 Final Development Starter Pack

> 最终开发启动包：停止需求扩散，进入 v0.1 开发。

---

## 1. Final Positioning

Corvus Mark is an AI-powered organizer for native browser bookmarks.

It does not replace browser bookmarks.  
It reads native Chromium bookmarks, generates an AI-assisted organize plan, lets the user preview every change, and then executes validated moves locally with rollback and diagnostics.

核心原则：

> AI suggests. User previews. Local deterministic code executes.  
> AI 只给建议，用户先预览，本地确定性代码执行。

---

## 2. Final Decisions

| Area | Decision |
|---|---|
| Product Name | Corvus Mark |
| v1.0 Browser Scope | Chromium only |
| Main Stack | TypeScript + WXT + React + Tailwind CSS + Zod + pnpm |
| Architecture | Clean Architecture + Ports & Adapters |
| Feature Flags | OpenFeature + Local Static Provider |
| Open Source | Open Core |
| Open Core License | MIT |
| Store Free Version | Same as GitHub open-source version |
| Pro in v1.0 | Architecture reserved only, no License Server |
| v1.0 AI Providers | DeepSeek, OpenAI, OpenRouter, Claude, Gemini, Ollama, LM Studio, OpenAI-compatible |
| Real Integration Test | DeepSeek |
| Other Provider Tests | Unit + Contract + Mock + Optional Smoke |
| Sensitive Data | Local only |
| Telemetry | None in v1.0 |
| Default URL Privacy | strict sanitize: remove query/hash |
| Rollback Source | MoveLog |
| Classification Stability | exact URL hash + host + manual correction |
| Delivery From Now | Single zip package |

---

## 3. Release Rhythm

### v0.1 Self-use Closed Loop

Goal: you can use it locally.

Must Have:

1. WXT + React + TypeScript skeleton.
2. Chromium extension local load.
3. BookmarkManagerPort.
4. ChromiumBookmarkAdapter.
5. StorageRoot with schemaVersion.
6. SecretStorePort.
7. DeepSeek Provider.
8. OpenAI-compatible Provider.
9. Default directory fallback.
10. Read and flatten bookmarks.
11. URL strict sanitize.
12. AI classify bookmarks.
13. OrganizePlan build and validate.
14. Preview table.
15. Apply selected items.
16. MoveLog rollback.
17. Basic Trace.
18. Settings page.
19. README draft.
20. Basic tests.

### v0.5 Open-source Preview

Goal: GitHub users can test it locally.

Adds:

1. OpenFeature + Local Static Provider.
2. CapabilityService.
3. Prompt templates.
4. Prompt static analysis.
5. AI directory recommendation.
6. Fallback directory mode.
7. exact URL hash memory.
8. host memory.
9. manual correction memory.
10. Task lock.
11. DiagnosticReport.
12. Performance modes.
13. Mainstream Provider adapters.
14. Provider contract tests.
15. Privacy regression tests.
16. Protocol tests.
17. README bilingual.
18. PRIVACY / SECURITY / CONTRIBUTING.
19. GitHub issue templates.
20. Donation entry.

### v1.0 Store Release

Goal: Chrome Web Store / Edge Add-ons.

Adds:

1. Chrome local load pass.
2. Edge local load pass.
3. rollback scenario pass.
4. diagnostic export pass.
5. privacy checklist pass.
6. package boundary check.
7. dependency audit.
8. license compliance.
9. SBOM.
10. checksum.
11. accessibility checklist.
12. browser compatibility docs.
13. provider compatibility docs.
14. release docs.
15. recovery guide.

---

## 4. Non-goals for v1.0

v1.0 does not do:

- Firefox
- Safari
- License Server
- Login
- Payment
- Cloud sync
- Team collaboration
- Telemetry
- Analytics
- Own backend
- Reading page content
- Browser history access
- Cookies access
- Deleting bookmarks
- Deleting folders
- Dead link cleanup
- Automatic delete
- Full Pro feature implementation

---

## 5. Free vs Future Pro

Free version permanently keeps the complete manual organizing workflow:

```text
configure AI
choose directory strategy
edit current prompt
generate plan
preview
apply
rollback
view trace
export diagnostic report
```

Future Pro enhances:

- multiple Prompt Profiles
- import/export profiles
- scheduled organize
- auto-classify new bookmarks
- provider fallback
- advanced stability reports
- advanced directory limits
- batch rule editor
- history multi-version
- sync
- team rules

Trace, Diagnostics, MoveLog rollback, task lock, and basic performance mode must never be paywalled.

---

## 6. Development Rule

Do not implement the whole project in one shot.

Every task must be:

- small
- compilable
- testable
- reversible
- documented

Start from schema and ports, not UI.
