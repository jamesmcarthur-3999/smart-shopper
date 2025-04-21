# Smart Shopper – Artifact Setup & Key Usage Guide for Claude

This guide tells **Claude** *when, why, and how* to scaffold or maintain the core support files, and how to use provided API keys directly via MCP calls—no placeholders, no mock data. Upload this file to the repo (`/docs/artifact_setup_guide.md`) and the Knowledge tab so Claude auto‑references it.

---
## 🗂️ 1 · Mandatory Artifacts
| Path | Purpose | Trigger for Creation | Minimal Initial Content |
|------|---------|----------------------|-------------------------|
| `/design/wireframes.png` or `/design/wireframes.md` | Visual layout spec for chat + canvas | **Missing** and user asks for UI change | Rough PNG export or Markdown checklist of sections (chat window, canvas grid) |
| `/docs/tool_schemas.json` | JSON‑Schema for every MCP tool | **Repo lacks file** or a new tool is registered | `{ "$schema":"http://json-schema.org/draft-07/schema#", "tools":{} }` |
| `/docs/canvas_op_schema.ts` | Type definitions for canvas ops | **Missing** and first canvas op is about to be emitted | Typescript interfaces mirroring §5 in Project Instructions |
| `/docs/error_codes.md` | Centralised error & retry policy | First time a tool returns error code not logged | Markdown table: code, meaning, retry strategy |
| `/docs/perf_budgets.md` | Latency & payload budgets | Bootstrap session | Table of phase targets from Project Brief |
| `.github/ISSUE_TEMPLATE/feature.yml` | Structured feature request template | Repo initialisation | YAML template with PLAN / tool list / acceptance criteria |
| `/docs/mdc_server_ideas.md` | Backlog of potential future tools | Whenever user brainstorms ideas | Bullet list with date + idea |
| `/docs/env_example` | Reference env vars (no secrets) | Repo initialisation | List actual env var names (e.g. CLAUDE_API_KEY, SERPAPI_API_KEY) with blank values |

### 1.1 Creation Rules
* **Check first** – If the file exists, patch it; else create with minimal stub.
* **Diff‑only commits** – Use `github.update_file` with a patch diff.
* **No placeholders** – Always fetch real data via MCP tools using provided keys.
* **Ask the user** when substantive content (e.g. real wireframes) is required.

---
## 🔄 2 · Maintenance Cycle
1. **PLAN** – State which artifact needs change and why.
2. **tool_use→github.update_file** – Apply patch or add file.
3. **REFLECT** – Summarise how the artifact now helps future tasks.

---
## 🤖 3 · Why These Artifacts Matter
* **Schemas & types** prevent tool‑param mismatches and allow type‑safe code generation.
* **Wireframes** anchor canvas ops to fixed dimensions & breakpoints.
* **Error & perf docs** enable Claude to self‑recover and respect SLAs.
* **Issue template** keeps future feature requests structured for PLAN blocks.
* **Environment sample** documents actual variable names; no secrets committed.

---
## 🔒 4 · Guardrails
* **API keys available via env-vars; use them directly in MCP calls.**
* **No mock data or placeholders** in runtime—real MCP calls only.
* Large binary assets (PNG/fig) < 1 MB; otherwise store link in Markdown.
* Keep tables narrow; break long Markdown into sub‑sections for Claude chunking.

---
### ✅ Success
Claude can bootstrap a brand‑new clone of the repo, create any missing mandatory artifacts **in one PLAN cycle**, use real API calls with provided keys, and explain their role without needing additional user prompts.

*Last updated: 2025‑04‑21**