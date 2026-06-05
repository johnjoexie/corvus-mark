# Corvus Mark

> AI-powered organizer for native browser bookmarks.  
> 面向浏览器原生书签的 AI 整理器。

Corvus Mark helps you clean and organize existing Chromium browser bookmarks with AI.

It does not replace browser bookmarks. It works with native bookmarks, generates an organize plan, lets you preview every change, and safely moves selected bookmarks with rollback support.

中文：Corvus Mark 不替代浏览器书签系统，而是用 AI 帮你整理已有的原生书签。AI 只给建议，用户先预览，本地确定性代码执行。

---

## Why Corvus Mark?

- Native browser bookmarks first
- Prompt-driven organization
- BYOK: bring your own AI API key
- Local-first settings and sensitive data
- Preview before apply
- No delete by default
- MoveLog rollback
- Trace and diagnostic report
- Open Core

---

## Supported Browsers

v1.0 focuses on Chromium-based browsers:

- Chrome
- Edge
- Brave
- Arc
- Opera

Firefox and Safari are planned later.

---

## Supported AI Providers

v1.0 target providers:

- DeepSeek
- OpenAI
- OpenRouter
- Anthropic Claude
- Google Gemini
- Ollama
- LM Studio
- OpenAI-compatible custom provider

Testing policy:

- DeepSeek is used for real manual integration testing.
- Other providers are covered by unit, contract, mock, smoke, and scenario tests.

---

## Free Workflow

Free version keeps the full manual organizing workflow:

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

---

## What Corvus Mark Does Not Do

Corvus Mark does not:

- read browsing history
- read page body by default
- upload your API key
- upload cookies
- delete bookmarks
- delete folders
- take over browser sync
- replace Raindrop or Karakeep
- upload your data to its own server
- move bookmarks without confirmation
- include telemetry or analytics in v1.0

---

## Privacy

Corvus Mark sends only the minimum fields needed for AI classification:

- bookmark id
- title
- sanitized URL
- current path

URLs are sanitized by default:

```text
https://example.com/path?a=1#token
→ https://example.com/path
```

API keys are stored locally in your browser extension storage.

---

## Architecture

Corvus Mark uses:

- TypeScript
- WXT
- React
- Tailwind CSS
- Zod
- OpenFeature
- pnpm workspace

Core architecture:

```text
UI
 ↓
Application Services
 ↓
Core Engine
 ↓
Ports
 ↓
Adapters
```

---

## License

MIT for the open core.

Future Pro features may use a commercial license.
