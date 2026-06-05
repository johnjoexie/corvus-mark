# Corvus Mark v5.0 Compatibility & Release Summary

---

## 1. Browser Compatibility

| Browser | v1.0 Support |
|---|---|
| Chrome | official |
| Edge | official |
| Brave | compatible |
| Arc | best-effort |
| Opera | best-effort |

v1.0 manual tests:

- Chrome local load
- Edge local load
- Brave local load if available

---

## 2. Provider Compatibility

| Provider | v1.0 Test Strategy |
|---|---|
| DeepSeek | real manual integration test |
| OpenAI-compatible | contract test |
| OpenAI | contract test |
| OpenRouter | contract test |
| Claude | mock + optional smoke |
| Gemini | mock + optional smoke |
| Ollama | mock + local smoke if available |
| LM Studio | mock + local smoke if available |

---

## 3. Accessibility

v1.0 checklist:

- keyboard focus
- labels
- readable error messages
- not color-only statuses
- ESC close dialogs
- rollback confirmation
- copyable diagnostics

---

## 4. Offline Mode

No AI configured or AI unavailable:

- use default directories
- use local rules
- use classification memory
- generate conservative Plan
- preview
- apply
- rollback

No network requests.

---

## 5. Data Export

Free:

- DiagnosticReport

Future Pro:

- PromptProfile
- DirectoryProfile
- OrganizePlan
- RulePack
- StabilityReport

Never export:

- API Key
- salt
- Authorization Header
- cookies
- raw query/hash
- browsing history
- page content
