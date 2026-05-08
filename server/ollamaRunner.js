import { spawn } from 'node:child_process';

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
let child = null;

if (await isOllamaRunning()) {
  console.log(`Ollama is already running at ${ollamaBaseUrl}. Keeping this monitor alive.`);
  keepAlive();
} else {
  console.log('Starting Ollama with `ollama serve`...');
  child = spawn('ollama', ['serve'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`ollama serve exited with code ${code}`);
      process.exit(code);
    }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

async function isOllamaRunning() {
  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

function shutdown() {
  if (child && !child.killed) {
    child.kill();
  }
}

function keepAlive() {
  setInterval(() => {}, 60_000);
}
