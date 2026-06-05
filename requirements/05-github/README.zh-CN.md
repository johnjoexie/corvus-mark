# Corvus Mark

> 面向浏览器原生书签的 AI 整理器。

Corvus Mark 用 AI 帮你整理 Chrome / Edge / Brave / Arc / Opera 的原生书签。

它不是另一个云书签应用，也不会替代浏览器书签系统。  
它会读取原生书签，生成整理计划，让你预览每一次变更，然后由本地确定性代码安全移动书签，并支持回滚。

核心原则：

```text
AI 只给建议
用户先预览
本地代码执行
MoveLog 可回滚
```

---

## 特点

- 直接管理浏览器原生书签
- Prompt 驱动整理规则
- BYOK：使用你自己的 AI API Key
- 本地优先
- 预览后再应用
- 默认不删除任何书签
- MoveLog 回滚
- Trace / Diagnostic Report 问题排查
- Open Core 半开源

---

## v1.0 浏览器范围

只做 Chromium：

- Chrome
- Edge
- Brave
- Arc
- Opera

Firefox / Safari 后续再做。

---

## v1.0 AI Provider

目标支持：

- DeepSeek
- OpenAI
- OpenRouter
- Claude
- Gemini
- Ollama
- LM Studio
- OpenAI-compatible

真实集成测试优先 DeepSeek，其它 Provider 通过单测、契约测试、Mock 测试和可选冒烟测试保证基础可用。

---

## 免费版完整链路

免费用户可以完整完成：

```text
配置 AI
选择目录策略
编辑当前 Prompt
生成整理计划
预览
应用
回滚
查看 Trace
导出 Diagnostic Report
```

---

## Corvus Mark 不会做什么

- 不读取浏览历史
- 不读取网页正文
- 不上传 API Key
- 不上传 Cookie
- 不删除书签
- 不删除目录
- 不接管浏览器同步
- 不替代 Raindrop / Karakeep
- 不上传数据到 Corvus Mark 自有服务器
- 未经确认不移动书签
- v1.0 不包含遥测和 analytics

---

## License

开源核心采用 MIT。

未来 Pro 能力可能采用商业 License。
