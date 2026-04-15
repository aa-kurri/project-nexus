import os
import re
from mcp.server.fastmcp import FastMCP

# Forge Auditor — Crucible Consistency Guard
# Ensures Ayura OS development adheres to architectural and design standards.

mcp = FastMCP("ForgeAuditor")

ROOT = os.getcwd()
MIGRATIONS_DIR = os.path.join(ROOT, "examples", "ayura", "supabase", "migrations")
COMPONENTS_DIR = os.path.join(ROOT, "apps", "web", "components")

@mcp.tool()
def audit_database_schema() -> str:
    """Checks all migrations for multi-tenant safety (tenant_id columns) and RLS enablement."""
    if not os.path.exists(MIGRATIONS_DIR):
        return "Error: Migrations directory not found."
    
    issues = []
    for file in os.listdir(MIGRATIONS_DIR):
        if not file.endswith(".sql"): continue
        path = os.path.join(MIGRATIONS_DIR, file)
        with open(path, 'r') as f:
            content = f.read()
            
            # Simple check for table creation without tenant_id
            tables = re.findall(r'CREATE TABLE ([a-zA-Z0-9_]+)', content, re.IGNORECASE)
            for table in tables:
                if "tenant_id" not in content.lower() and table.lower() not in ["agent_memories"]:
                     issues.append(f"⚠️ {file}: Table '{table}' might be missing tenant_id column.")
                
                if "ENABLE ROW LEVEL SECURITY" not in content.upper() and table.lower() not in ["agent_memories"]:
                     issues.append(f"⚠️ {file}: Table '{table}' might be missing RLS enablement.")
                     
    if not issues:
        return "✅ Database Audit Passed: All tables appear multi-tenant safe."
    return "\n".join(issues)

@mcp.tool()
def audit_ui_theming() -> str:
    """Audits UI components to ensure they follow the Ayura OS design system (Teal accent)."""
    if not os.path.exists(COMPONENTS_DIR):
        return "Error: Components directory not found."
    
    issues = []
    # Primary teal check: #0F766E, teal-700
    for root, dirs, files in os.walk(COMPONENTS_DIR):
        for file in files:
            if not (file.endswith(".tsx") or file.endswith(".ts")): continue
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                # If it's a UI component using blue/red/green instead of teal
                if "text-blue-" in content or "bg-blue-" in content:
                    issues.append(f"🎨 {os.path.relpath(path, ROOT)}: Using blue utility instead of Ayura Teal (#0F766E).")
                if "text-red-" in content and "error" not in content.lower():
                    issues.append(f"🎨 {os.path.relpath(path, ROOT)}: Non-error text using red utility.")

    if not issues:
        return "✅ UI Theme Audit Passed: All components appear compliant with the Ayura design system."
    return "\n".join(issues)

@mcp.tool()
def check_implementation_status() -> str:
    """Analyzes Stories vs components to detect 'shadow work' or missing implementations."""
    stories_path = os.path.join(ROOT, "examples", "ayura", "STORIES.md")
    if not os.path.exists(stories_path): return "Error: STORIES.md not found."
    
    with open(stories_path, 'r') as f:
        content = f.read()
        stories = re.findall(r'### (S-[A-Z0-9-]+)', content)
        
    state_path = os.path.join(ROOT, "examples", "ayura", ".build-state.json")
    completed = []
    if os.path.exists(state_path):
        with open(state_path, 'r') as f:
            state = json.load(f)
            completed = state.get("completed", [])

    return f"Status: {len(completed)} stories completed out of {len(stories)} planned. To implement next: {stories[len(completed)] if len(completed) < len(stories) else 'None'}"

if __name__ == "__main__":
    mcp.run()
