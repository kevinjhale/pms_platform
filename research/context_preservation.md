# Context Preservation Solutions for Claude Code

Research on maintaining context across auto-compaction events.

## The Problem

When Claude Code's context window fills up, auto-compaction summarizes the conversation, potentially losing:
- Solutions discussed but not implemented
- Architectural decisions and rationale
- Problem context and debugging history
- Implementation details and patterns

## Solutions Evaluated

### 1. Beads (by Steve Yegge)

**Repository:** https://github.com/steveyegge/beads

Git-backed issue tracker designed for AI agents. Tasks persist in `.beads/` as JSONL files.

**Key features:**
- Dependency-aware task graph with hash-based IDs (prevents merge collisions)
- SQLite cache for fast queries + background sync daemon
- "Memory decay" - semantic summarization of closed tasks to save context
- Works across agents (Claude Code, Codex, AMP)

**Installation:** `npm install -g @beads/bd` then `bd init`

**Best for:** Multi-session work with complex task dependencies, team/multi-agent workflows

**Tradeoffs:** Requires learning a new task management paradigm; more suited for project management than raw context preservation

---

### 2. Gas Town (by Steve Yegge)

**Repository:** https://github.com/steveyegge/gastown

Multi-agent orchestrator built on Beads. Manages 20-30 parallel Claude Code agents via tmux.

**Key features:**
- Persistent agent roles (Mayor, Polecats, Refinery, etc.)
- `gt prime` command for context recovery mid-session
- All state backed by Git through Beads
- Graceful degradation when agents crash or run out of context

**Best for:** Large projects needing parallel agent work, enterprise-scale development

**Tradeoffs:** Heavy infrastructure; overkill for solo development; steep learning curve

---

### 3. context-by-md

**Repository:** https://github.com/Hotschmoe/context-by-md

Lightweight markdown-based context system using Claude Code slash commands.

**Key features:**
- `CURRENT.md` tracks active task/session focus
- `PLAN.md` maintains task backlog
- Decision logging via `/context-task decide`
- Zero external dependencies - just markdown files

**Philosophy:** "80% of the value with 20% of the complexity"

**Best for:** Solo developers, small teams, those who prefer human-readable state

**Tradeoffs:** Manual discipline required; no automatic capture; less sophisticated than Beads

---

### 4. c0ntextKeeper

**Repository:** https://github.com/Capnjbrown/c0ntextKeeper

Automatic context preservation via Claude Code hooks + MCP tools.

**Key features:**
- 7 hooks (PreCompact, PostToolUse, SessionStart/End, etc.)
- 187 semantic patterns to detect problems/solutions/decisions
- Searchable archive with relevance scoring + temporal decay
- 3 MCP tools: `fetch_context`, `search_archive`, `get_patterns`
- Auto-redacts secrets before archiving

**Installation:** `npm install -g c0ntextkeeper && c0ntextkeeper setup`

**Best for:** "Set and forget" automatic preservation; recovering lost solutions

**Tradeoffs:** Another dependency; archive can grow large; retrieval quality depends on semantic patterns

---

### 5. Continuous-Claude-v3

**Repository:** https://github.com/parcadei/Continuous-Claude-v3

Full context management system with ledgers, handoffs, and memory extraction.

**Key features:**
- Continuity Ledgers (within-session) + Handoffs (between-session YAML)
- Daemon extracts learnings from thinking blocks post-session
- PostgreSQL + pgvector for memory storage
- 109 skills, 32 agents, 30 hooks
- TLDR code analysis claims 95% token savings

**Best for:** Power users wanting maximum context efficiency

**Tradeoffs:** Very complex; requires PostgreSQL; 12-step installation; may conflict with existing setup

---

## Comparison Matrix

| Solution | Complexity | Auto-capture | Search | Dependencies | Best For |
|----------|------------|--------------|--------|--------------|----------|
| Beads | Medium | No (manual) | Yes (SQLite) | Go/npm | Task-oriented teams |
| Gas Town | High | Yes | Yes | Beads + tmux | Multi-agent at scale |
| context-by-md | Low | No | No | None | Solo, simplicity |
| c0ntextKeeper | Low | Yes | Yes (MCP) | Node.js | Set-and-forget |
| Continuous-Claude | Very High | Yes | Yes (pgvector) | PostgreSQL | Power users |
| DIY Hooks | Variable | Your choice | Your choice | None | Custom needs |

---

## Chosen Approach: DIY Hooks

For this project, we're implementing a custom solution using Claude Code hooks:

- **PreCompact**: Capture session state before compaction
- **SessionStart**: Load previous context into the session
- **Stop**: Save final state when session ends

This approach:
- Zero external dependencies
- Integrates with existing `SESSION_NOTES.md` workflow
- Human-readable markdown output
- Full control over what's preserved

See `.claude/hooks/` for implementation.
