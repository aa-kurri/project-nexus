---
name: story-orchestrator
description:
  Autonomous build orchestration for Ayura OS. Manages the story queue,
  extracts specifications, and triggers the code builder. Use when
  checking build status, getting story details, or advancing the sprint.
triggers:
  - 'build story'
  - 'next story'
  - 'sprint status'
  - 'story gherkin'
---

# 🏗 Story Orchestrator

The Forge's official liaison for the Ayura OS Autonomous Builder.

## Capabilities

- **Queue Management**: Monitor `SPRINTS.md` vs `.build-state.json`.
- **Spec Extraction**: Context-aware Gherkin parsing from `STORIES.md`.
- **Build Triggering**: Interfaces with `scripts/story-runner.js`.

## Usage

```markdown
@skill story-orchestrator

What is the next story in the queue?
> get_build_status()

Implement the next story S-LIMS-5.
> trigger_next_build()

Read the spec for S-PHARM-2.
> get_story_specification("S-PHARM-2")
```

## Best Practices

1. **Verify State**: Always call `get_build_status()` before triggering a build to ensure no double-builds.
2. **Context Enrichment**: Use `get_story_specification()` to load the prompt with the exact Gherkin requirements.
3. **Commit discipline**: The orchestrator automatically handles git commits for successful builds.
