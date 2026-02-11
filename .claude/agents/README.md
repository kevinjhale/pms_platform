# Agent Configurations

Custom agent prompt files for the development workflow. Each file contains instructions, model assignment, and output format for a specific stage.

**How agents are invoked:** The main Claude instance reads an agent file, then uses the Task tool with `subagent_type="general-purpose"`, passing the Instructions section as the prompt and setting the `model` parameter to match the `## Model` field. See CLAUDE.md for the full workflow.

## Quick Reference

| Agent | Model | Purpose | Trigger |
|-------|-------|---------|---------|
| [architect](./architect.md) | opus (claude-opus-4-6) | System design & planning | Before non-trivial features |
| [code-reviewer](./code-reviewer.md) | sonnet (claude-sonnet-4-5) | Quality & anti-pattern check | After implementation |
| [test-writer](./test-writer.md) | sonnet (claude-sonnet-4-5) | Test generation | After review passes |
| [a11y-auditor](./a11y-auditor.md) | haiku (claude-haiku-4-5) | WCAG 2.1 AA compliance | After UI changes |
| [sql-writer](./sql-writer.md) | sonnet (claude-sonnet-4-5) | Database & migrations | Data layer work |
| [refactor-planner](./refactor-planner.md) | opus (claude-opus-4-6) | Tech debt analysis | On request / periodic |
| [api-designer](./api-designer.md) | sonnet (claude-sonnet-4-5) | REST API design | New endpoints |
| [commit-preparer](./commit-preparer.md) | haiku (claude-haiku-4-5) | Atomic commit prep | Before committing |

## Model Strategy

- **opus** (claude-opus-4-6) - High-stakes decisions: architect, refactor-planner
- **sonnet** (claude-sonnet-4-5) - Balanced quality/cost: code-reviewer, test-writer, sql-writer, api-designer
- **haiku** (claude-haiku-4-5) - Checklist/validation: a11y-auditor, commit-preparer

## Dynamic Model Upgrades

Some agents upgrade to a higher model for complex scenarios:

**a11y-auditor:** haiku -> sonnet
- Complex interactive components, custom widgets with ARIA, dynamic content

**commit-preparer:** haiku -> sonnet
- Changes span 5+ files, breaking changes, critical path modifications

**code-reviewer:** sonnet -> opus
- Security-critical code, authentication/authorization, payment/financial logic

## Customization

Each agent config includes:
- **Model**: Default model assignment
- **Model Upgrade**: When to use a higher model
- **Instructions**: Detailed prompts and guidelines
- **Output Format**: Expected response structure
- **What NOT to Do**: Common mistakes to avoid

Modify individual agent files to adjust behavior for your specific needs.
