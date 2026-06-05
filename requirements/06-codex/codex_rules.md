# Codex Rules for Corvus Mark

1. Never implement the whole project in one pass.
2. Every task must compile.
3. Every task must have tests when applicable.
4. Core must not import browser adapters.
5. Core must not call chrome APIs.
6. Core must not call OpenFeature SDK directly.
7. AI output must be validated by Zod.
8. No bookmark delete APIs in v1.0.
9. No raw URL in AI payload.
10. No API Key in Trace or DiagnosticReport.
11. Small commits only.
12. Update docs when changing protocol.
