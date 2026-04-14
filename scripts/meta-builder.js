const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// The active tools we can route between based on quota.
const AI_ENGINES = [
  { name: 'Antigravity', command: 'antigravity', args: ['--task'] },
  { name: 'Claude Code', command: 'claude', args: ['-p'] }
];

async function runAITerminal(engine, taskDescription) {
  return new Promise((resolve, reject) => {
    console.log(`\n🤖 [Meta-Builder] Spawning ${engine.name} terminal...`);
    
    // Spawn the actual CLI agent programmatically
    const agentProcess = spawn(engine.command, [...engine.args, taskDescription], {
      cwd: path.resolve(__dirname, '../'),
      env: { ...process.env, NON_INTERACTIVE: 'true' }
    });

    let outputLog = "";

    agentProcess.stdout.on('data', (data) => {
      const text = data.toString();
      outputLog += text;
      process.stdout.write(text); // Pipe output to master terminal

      // Detect Quota Limits or Rate Limits in standard output
      if (text.toLowerCase().includes('quota exceeded') || text.toLowerCase().includes('429 too many requests')) {
        console.log(`\n⚠️ [Meta-Builder] Quota limit detected in ${engine.name}. Terminating process.`);
        agentProcess.kill('SIGINT');
        reject(new Error('QUOTA_EXCEEDED'));
      }
    });

    agentProcess.stderr.on('data', (data) => {
      console.error(`[${engine.name} Error]: ${data}`);
    });

    agentProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [Meta-Builder] ${engine.name} completed the task successfully.`);
        resolve(outputLog);
      } else if (code !== null) {
        // Did not successfully close
        reject(new Error('EXECUTION_FAILED'));
      }
    });
  });
}

async function orchestrateAyuraBuild() {
  console.log("🚀 Starting Autonomous Ayura OS Build Pipeline");
  
  // 1. Read the blueprint that Antigravity generated
  const sprinstPath = path.resolve(__dirname, '../examples/ayura/SPRINTS.md');
  const blueprint = fs.readFileSync(sprinstPath, 'utf-8');

  // We loop through a high-level task queue
  const taskQueue = [
    "Read examples/ayura/PRD.md and initialize a fresh Next.js 14 App Router project in apps/web. Do not wait for prompts.",
    "Read examples/ayura/COMPONENT_MAPPING.md and install all Shadcn components (Button, Table, Card, Input).",
    "Build the multi-store inventory UI as defined in S-PHARM-1 using Tremor charts."
  ];

  for (const [index, task] of taskQueue.entries()) {
    console.log(`\n--- Executing Task ${index + 1}/${taskQueue.length} ---`);
    let taskCompleted = false;

    // Route across models until one succeeds
    for (const engine of AI_ENGINES) {
      try {
        await runAITerminal(engine, task);
        taskCompleted = true;
        break; // Break engine loop, move to next task
      } catch (error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          console.log(`🔄 [Meta-Builder] Rerouting to next available agent...`);
          continue; // Try the next engine in the array
        } else {
          console.error(`❌ Fatal Error during execution: ${error.message}`);
          break;
        }
      }
    }

    if (!taskCompleted) {
      console.log("🛑 ALL AI ENGINES ARE TAPPED OUT ON QUOTA. Pausing pipeline. Will retry on next Cron schedule.");
      process.exit(1); 
    }
  }

  // Once all tasks finish, commit dynamically
  const gitCommit = spawn('git', ['add', '.', '&&', 'git', 'commit', '-m', '"feat(auto): autonomous build module completed"', '&&', 'git', 'push'], { shell: true });
  console.log("\n🚀 Pipeline finished. Code pushed to GitHub.");
}

orchestrateAyuraBuild();
