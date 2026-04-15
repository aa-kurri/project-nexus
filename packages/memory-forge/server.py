import os
import json
import uuid
from datetime import datetime
from mcp.server.fastmcp import FastMCP

# Memory Forge — Project Nexus Edition
# A semantic "cognitive checkpoint" system based on Crucible patterns.
# Integrated into the Ayura OS workflow to save tokens.

mcp = FastMCP("MemoryForge")

# Local fallback store if Supabase isn't reachable or configured
LOCAL_STORE_PATH = os.path.expanduser("~/.agent/memory-forge.json")

def ensure_local_store():
    if not os.path.exists(os.path.dirname(LOCAL_STORE_PATH)):
        os.makedirs(os.path.dirname(LOCAL_STORE_PATH), exist_ok=True)
    if not os.path.exists(LOCAL_STORE_PATH):
        with open(LOCAL_STORE_PATH, 'w') as f:
            json.dump({"memories": []}, f)

@mcp.tool()
def save_memory(content: str, agent_id: str, tags: list = None, metadata: dict = None) -> str:
    """Saves a cognitive checkpoint (session state) for future recall."""
    ensure_local_store()
    
    memory_id = str(uuid.uuid4())
    entry = {
        "id": memory_id,
        "agent_id": agent_id,
        "content": content,
        "tags": tags or [],
        "metadata": metadata or {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    with open(LOCAL_STORE_PATH, 'r+') as f:
        data = json.load(f)
        data["memories"].append(entry)
        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()
        
    return f"Memory saved successfully with ID: {memory_id}. I will now recall this when needed to avoid re-reading large contexts."

@mcp.tool()
def search_memories(query: str, agent_id: str = None, limit: int = 5) -> str:
    """Searches past cognitive checkpoints for relevant context to solve a task."""
    ensure_local_store()
    
    with open(LOCAL_STORE_PATH, 'r') as f:
        data = json.load(f)
        
    memories = data.get("memories", [])
    
    # Simple keyword/tag search fallback (until OpenAI embedding connector is added)
    results = []
    query_terms = query.lower().split()
    
    for m in memories:
        if agent_id and m["agent_id"] != agent_id:
            continue
            
        score = 0
        content_lower = m["content"].lower()
        for term in query_terms:
            if term in content_lower: score += 1
            if term in [t.lower() for t in m["tags"]]: score += 5
            
        if score > 0:
            results.append((score, m))
            
    results.sort(key=lambda x: x[0], reverse=True)
    top_results = [r[1] for r in results[:limit]]
    
    if not top_results:
        return "No relevant memories found in the Forge."
        
    return json.dumps(top_results, indent=2)

@mcp.tool()
def record_observation(tool_name: str, summary: str, status: str = "success") -> str:
    """Automatically records a tool execution summary as a persistent observation."""
    ensure_local_store()
    
    memory_id = str(uuid.uuid4())
    entry = {
        "id": memory_id,
        "agent_id": "auto-logger",
        "content": f"Tool: {tool_name} | Status: {status} | Summary: {summary}",
        "tags": ["observation", tool_name],
        "metadata": {"type": "observation", "tool": tool_name, "status": status},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    with open(LOCAL_STORE_PATH, 'r+') as f:
        data = json.load(f)
        data["memories"].append(entry)
        f.seek(0)
        json.dump(data, f, indent=2)
        f.truncate()
        
    return f"Observation recorded: {memory_id}"

@mcp.tool()
def get_timeline(limit: int = 10) -> str:
    """Retrieves a chronological timeline of recent tool observations and checkpoints."""
    ensure_local_store()
    
    with open(LOCAL_STORE_PATH, 'r') as f:
        data = json.load(f)
        
    memories = data.get("memories", [])
    # Sort by timestamp descending
    memories.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    timeline = []
    for m in memories[:limit]:
        ts = m.get("timestamp", "").split("T")[-1][:8]
        content = m.get("content", "")
        timeline.append(f"[{ts}] {content}")
        
    if not timeline:
        return "No memories in the timeline yet."
        
    return "\n".join(timeline)

if __name__ == "__main__":
    mcp.run()
