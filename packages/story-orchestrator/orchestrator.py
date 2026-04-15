import os
import json
import re
import subprocess
from mcp.server.fastmcp import FastMCP

# Ayura OS — Story Orchestrator MCP
# Encodes the wisdom of the Autonomous Builder into a toolset for Claude.

mcp = FastMCP("StoryOrchestrator")

ROOT = os.getcwd()
AYURA_DIR = os.path.join(ROOT, "examples", "ayura")
STATE_FILE = os.path.join(AYURA_DIR, ".build-state.json")
SPRINTS_FILE = os.path.join(AYURA_DIR, "SPRINTS.md")
STORIES_FILE = os.path.join(AYURA_DIR, "STORIES.md")

@mcp.tool()
def get_build_status() -> str:
    """Returns the current progress of the autonomous build queue."""
    if not os.path.exists(STATE_FILE):
        return "No build state found. Build hasn't started."
    
    with open(STATE_FILE, 'r') as f:
        state = json.load(f)
    
    completed = state.get("completed", [])
    skipped = state.get("skipped", [])
    last_run = state.get("last_run", "Never")
    
    # Parse total from SPRINTS.md
    total_stories = 0
    next_up = "Done"
    
    if os.path.exists(SPRINTS_FILE):
        with open(SPRINTS_FILE, 'r') as f:
            content = f.read()
            # Match | 8 | P0 | Description | `S-LIMS-5` |
            matches = re.findall(r'\|.*\|.*\|.*\|.*`(S-[A-Z0-9-]+)`.*\|', content)
            total_stories = len(matches)
            for m in matches:
                if m not in completed and m not in skipped:
                    next_up = m
                    break
    
    return json.dumps({
        "completed_count": len(completed),
        "skipped_count": len(skipped),
        "total_count": total_stories,
        "remaining_count": total_stories - len(completed) - len(skipped),
        "next_story": next_up,
        "last_run": last_run
    }, indent=2)

@mcp.tool()
def get_story_specification(slug: str) -> str:
    """Extracts the title and Gherkin specification for a specific story slug."""
    if not os.path.exists(STORIES_FILE):
        return f"Error: {STORIES_FILE} not found."
    
    with open(STORIES_FILE, 'r') as f:
        md = f.read()
    
    # Header: ### S-LIMS-1 · Barcode sample tracking · **P0** · 5 pts
    pattern = rf'###\s+({re.escape(slug)})\s+·\s+(.+?)\n([\s\S]*?)(?=\n###|\n---\n|$)'
    match = re.search(pattern, md)
    
    if not match:
        return f"Story {slug} not found in {STORIES_FILE}."
    
    return f"Title: {match.group(2).strip()}\n\nSpecification:\n{match.group(3).strip()}"

@mcp.tool()
def trigger_next_build() -> str:
    """Triggers the autonomous builder (scripts/story-runner.js) for the next pending story."""
    try:
        # Note: We assume 'node' is in the system path where this MCP is executed.
        # In this restricted environment, it might fail, but it's designed for the user's desktop context.
        result = subprocess.run(
            ["node", "scripts/story-runner.js"],
            capture_output=True,
            text=True,
            cwd=ROOT
        )
        if result.returncode == 0:
            return f"Build successful!\n\nOutput:\n{result.stdout}"
        else:
            return f"Build failed with exit code {result.returncode}.\n\nError:\n{result.stderr}\n\nOutput:\n{result.stdout}"
    except Exception as e:
        return f"Failed to trigger build: {str(e)}"

if __name__ == "__main__":
    mcp.run()
