---
name: forge-auditor
description:
  Architectural and design system guardrail tool. Use when adding
  new features, creating database tables, or modifying UI components
  to ensure they meet Ayura OS standards.
triggers:
  - 'audit'
  - 'check lint'
  - 'validate schema'
  - 'check design'
---

# 🛡 Forge Auditor

Consistency guard for the Ayura OS Forge.

## Capabilities

- **Schema Audit**: Ensure `tenant_id` and RLS are present in all migrations.
- **UI Audit**: Validate that components adhere to the Teal (#0F766E) design system.
- **Drift Detection**: Compare planned stories vs actual implementations.

## Usage

```markdown
@skill forge-auditor

Audit the latest database changes.
> audit_database_schema()

Check if the new components follow the teal design system.
> audit_ui_theming()
```

## Best Practices

1. **Pre-commit Audit**: Run `audit_database_schema` before finalizing any story that includes DB changes.
2. **Visual Consistency**: Run `audit_ui_theming` when reviewers mention color mismatches.
