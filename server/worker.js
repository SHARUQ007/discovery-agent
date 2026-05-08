import 'dotenv/config';
import { getOldestPendingRun, updateRemoteRun } from './sheetsStore.js';

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const pollIntervalMs = Number(process.env.WORKER_POLL_INTERVAL_MS ?? 5000);

console.log('Structured Discovery Agent worker started.');
console.log(`Polling Google Sheets every ${pollIntervalMs}ms.`);
console.log(`Using Ollama at ${ollamaBaseUrl}.`);

while (true) {
  try {
    const run = await getOldestPendingRun();

    if (!run) {
      await wait(pollIntervalMs);
      continue;
    }

    console.log(`Processing run ${run.runId} with ${run.model}...`);
    await updateRemoteRun(run.rowNumber, { status: 'running', error: '' });

    try {
      const result = await generateOllamaResult(run.model, run.prompt);
      await updateRemoteRun(run.rowNumber, { status: 'completed', result, error: '' });
      console.log(`Completed run ${run.runId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Worker failed.';
      await updateRemoteRun(run.rowNumber, { status: 'failed', error: message });
      console.error(`Failed run ${run.runId}: ${message}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  }

  await wait(pollIntervalMs);
}

async function generateOllamaResult(model, prompt) {
  const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.2,
        num_ctx: 8192,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Ollama generation failed.');
  }

  const data = await response.json();
  const result = data.response ?? '';

  if (!result.trim()) {
    throw new Error('Ollama returned an empty response.');
  }

  return result;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
