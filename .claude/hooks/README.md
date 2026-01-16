# Context Preservation Hooks

Custom hooks for preserving context across Claude Code auto-compaction events.

## Overview

These hooks automatically capture and restore session context:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `session-start.js` | New session begins | Loads context from previous sessions |
| `pre-compact.js` | Before auto-compaction | Saves snapshot of current state |
| `session-stop.js` | Session ends | Records final state and modified files |

## Files Generated

- `.claude/CONTEXT_SNAPSHOT.md` - Saved before compaction, helps recover lost context
- `.claude/LAST_SESSION.md` - Summary of previous session
- `.claude/session-log.jsonl` - Append-only log of session events

## How It Works

### SessionStart
1. Checks for recent compaction (CONTEXT_SNAPSHOT.md age)
2. Loads TODO_TONIGHT.md priorities if present
3. Extracts "Current Focus" and "Recent Work" from SESSION_NOTES.md
4. Shows recent git commits and uncommitted changes
5. Outputs to stdout (injected into Claude's context)

### PreCompact
1. Extracts key sections from SESSION_NOTES.md
2. Saves to CONTEXT_SNAPSHOT.md
3. Outputs to stderr (logged but not injected)

### Stop
1. Logs session end to session-log.jsonl
2. Captures recent commits and modified files
3. Writes LAST_SESSION.md summary

## Configuration

Hooks are configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [{ "command": "node .claude/hooks/session-start.js" }],
    "PreCompact": [{ "command": "node .claude/hooks/pre-compact.js" }],
    "Stop": [{ "command": "node .claude/hooks/session-stop.js" }]
  }
}
```

## Testing Manually

```bash
# Test session-start (outputs to stdout)
node .claude/hooks/session-start.js

# Test pre-compact (creates CONTEXT_SNAPSHOT.md)
node .claude/hooks/pre-compact.js

# Test session-stop (creates LAST_SESSION.md)
node .claude/hooks/session-stop.js
```

## Customization

Edit the section regex patterns in each hook to match your SESSION_NOTES.md structure:

```javascript
// In session-start.js
const currentFocus = extractSection(sessionNotes, 'Current Focus');
const recentWork = extractSection(sessionNotes, 'Recent Work');
```

## Best Practices

1. **Manual /compact at logical points** - Don't wait for auto-compact. Run `/compact` after completing features.

2. **Use custom compact instructions** - Guide what's preserved:
   ```
   /compact keep the database schema decisions and API patterns
   ```

3. **Keep SESSION_NOTES.md updated** - The hooks rely on this file for context recovery.

4. **Review CONTEXT_SNAPSHOT.md after compaction** - Check if important details were lost.
