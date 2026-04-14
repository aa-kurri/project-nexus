import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The active tools we can route between based on quota.
const AI_ENGINES = [
  { name: 'Antigravity', command: 'antigravity', args: ['--task'] },
  { name: 'Claude Code', command: 'claude', args: ['-p'] } // Claude Code explicitly authorized
];

/**
 * Spawns an AI CLI child process and intercepts quota limits or successes. 
 */
async function runAITerminal(engine, taskDescription) {
  return new Promise((resolve, reject) => {
    console.log(`\n🤖 [Meta-Builder] Spawning ${engine.name} terminal...`);
    
    // Convert multiline task to single line string if needed for bash args
    const safeDesc = taskDescription.replace(/\n/g, ' ');

    const agentProcess = spawn(engine.command, [...engine.args, safeDesc], {
      cwd: path.resolve(__dirname, '../'),
      env: { ...process.env, NON_INTERACTIVE: 'true' }
    });

    let outputLog = "";

    agentProcess.stdout.on('data', (data) => {
      const text = data.toString();
      outputLog += text;
      process.stdout.write(text); // Pipe output to master terminal

      // Intercept quota errors across multiple CLI formats
      if (text.toLowerCase().includes('quota exceeded') || text.toLowerCase().includes('429 too many requests')) {
        console.log(`\n⚠️ [Meta-Builder] Quota limit detected in ${engine.name}. Terminating process.`);
        agentProcess.kill('SIGINT');
        reject(new Error('QUOTA_EXCEEDED'));
      }
    });

    agentProcess.stderr.on('data', (data) => {
      console.error(`[${engine.name} Stderr]: ${data}`);
    });

    agentProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ [Meta-Builder] ${engine.name} completed successfully.`);
        resolve(outputLog);
      } else if (code !== null) {
        reject(new Error('EXECUTION_FAILED'));
      }
    });
  });
}

/**
 * Reads the stories markdown and converts Gherkin Scenarios into direct AI tasks.
 */
function parseTasksFromStories() {
  const storiesPath = path.resolve(__dirname, '../examples/ayura/STORIES.md');
  const markdown = fs.readFileSync(storiesPath, 'utf8');
  
  const tasks = [];
  
  // Extract all lines that look like "Scenario: Something happens"
  const scenarioRegex = /Scenario:\s*(.+)/g;
  let match;
  while ((match = scenarioRegex.exec(markdown)) !== null) {
    const scenarioName = match[1].trim();
    tasks.push(`Locate the exact Gherkin requirements for '${scenarioName}' within examples/ayura/STORIES.md. Implement all the UI components, database routes, and Next.js APIs required to make this scenario fully functional according to the PRD. Do not stop until the feature works.`);
  }

  return tasks;
}

/**
 * Main Autonomous Pipeline
 */
async function orchestrateAyuraBuild() {
  console.log("🚀 =============================================");
  console.log("🚀 Starting Autonomous Ayura OS Build Pipeline");
  console.log("🚀 =============================================\n");
  
  // 1. Core Bootstrapping (Zero-Human Stack Initialization)
  const bootstrapTasks = [
    `Create a new Next.js 14 App Router project inside apps/web. Use TailwindCSS and TypeScript. Configure the theme exactly to match the tokens defined in examples/ayura/COMPONENT_MAPPING.md (Ayura Teal #0F766E). Run 'npx shadcn-ui@latest init' globally without human limits.`,
    `Install Supabase JS client and set up the local Supabase instance using configurations found in examples/ayura/supabase/config.toml, applying the core_foundations.sql migrations to establish the RLS schema.`
  ];

  // 2. Dynamic Gherkin Parsing
  console.log("🧠 Analyzing examples/ayura/STORIES.md to construct feature task queue...");
  const featureTasks = parseTasksFromStories();
  console.log(`Found ${featureTasks.length} distinct epics and scenarios to build.\n`);

  const masterQueue = [...bootstrapTasks, ...featureTasks];

  for (const [index, task] of masterQueue.entries()) {
    console.log(`\n--- ⚙️ Executing Task ${index + 1}/${masterQueue.length} ---`);
    console.log(`Objective: ${task.substring(0, 100)}...`);
    
    let taskCompleted = false;

    // Fallback logic loop
    for (const engine of AI_ENGINES) {
      try {
        await runAITerminal(engine, task);
        taskCompleted = true;
        
        // At the end of every successful task, commit the chunk to GitHub.
        console.log(`📦 Autonomous Commit Checkpoint...`);
        spawn('git', ['add', '.', '&&', 'git', 'commit', '-am', `"feat(auto-build): completed task ${index + 1}"`], { shell: true });
        
        break; // Break engine loop, move to next task
      } catch (error) {
        if (error.message === 'QUOTA_EXCEEDED') {
          console.log(`🔄 [Meta-Builder] Quota burnt. Rerouting to next available agent...`);
          continue; 
        } else {
          console.error(`❌ [Meta-Builder] Fatal Error during execution: ${error.message}`);
          break;
        }
      }
    }

    if (!taskCompleted) {
      console.log("🛑 ALL AI ENGINES ARE TAPPED OUT ON QUOTA OR CRASHED. Pausing pipeline. Will retry automatically on next cron interval.");
      process.exit(1); 
    }
  }

  // 3. Final Deployment Push
  console.log("\n🚀 Pipeline finished successfully. Pushing all committed feature chunks to GitHub Vercel bridge...");
  spawn('git', ['push', '-u', 'origin', 'main'], { shell: true });
  console.log("🟢 Autonomy complete.");
}

// Kickstart
orchestrateAyuraBuild();
