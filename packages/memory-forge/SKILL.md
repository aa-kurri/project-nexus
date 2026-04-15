---
name: memory-forge
description:
  A cognitive checkpoint system for storing agent state, decisions, and
  important context. Use to "save tokens" by externalizing short-term
  memory and retrieving it semantically.
triggers:
  - 'remember'
  - 'save state'
  - 'checkpoint'
  - 'recall memory'
---

# 🧠 Memory Forge

Cognitive persistence for multi-step AI workflows.

## Capabilities

- **Checkpointing**: Save a snapshot of logic or decisions with `save_memory`.
- **Observation Logging**: Record what was done via `record_observation` (inspired by claude-mem).
- **Timeline**: View a chronological history of work with `get_timeline`.
- **Semantic Recall**: Retrieve relevant context for new tasks with `search_memories`.

## Usage

```markdown
@skill memory-forge

Log a significant tool outcome.
> record_observation("write_to_file", "Created the LIMS QC component following teal design.")

Check what was done recently.
> get_timeline(5)

Remember that we decided to use Westgard rules specifically for LIMS QC.
> save_memory("Use Westgard rules (1-2s, 1-3s, 2-2s) for LIMS QC", "lims-builder", ["qc", "westgard"])
```
