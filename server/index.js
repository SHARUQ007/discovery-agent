import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createRemoteRun,
  ensureSheetHeaders,
  getRemoteRun,
  getSheetsClient,
  readLatestCompletedRun,
  sheetName,
} from './sheetsStore.js';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');

app.use(express.json({ limit: '25mb' }));
app.use((request, response, next) => {
  const origin = request.headers.origin;

  response.setHeader('Access-Control-Allow-Origin', origin ?? '*');
  response.setHeader('Vary', 'Origin');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
});

app.get('/api/ollama/health', async (_request, response) => {
  try {
    const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/tags`);
    if (!ollamaResponse.ok) {
      response.status(502).json({ ok: false, error: 'Ollama did not respond successfully.' });
      return;
    }

    const data = await ollamaResponse.json();
    response.json({ ok: true, models: data.models ?? [] });
  } catch {
    response.status(503).json({
      ok: false,
      error: 'Ollama is not reachable. Start it with `ollama serve` and pull a model.',
    });
  }
});

app.post('/api/ollama/generate', async (request, response) => {
  const { model, prompt } = request.body ?? {};

  if (!model || typeof model !== 'string') {
    response.status(400).json({ error: 'Missing Ollama model name.' });
    return;
  }

  if (!prompt || typeof prompt !== 'string') {
    response.status(400).json({ error: 'Missing prompt.' });
    return;
  }

  try {
    const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/generate`, {
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

    if (!ollamaResponse.ok) {
      const text = await ollamaResponse.text();
      response.status(ollamaResponse.status).json({
        error: text || 'Ollama generation failed.',
      });
      return;
    }

    const data = await ollamaResponse.json();
    const result = data.response ?? '';

    if (!result.trim()) {
      response.status(502).json({
        error:
          'Ollama returned an empty response. Try a smaller model, reduce the number of transcripts, or test the model directly with `ollama run <model> "Reply with READY"`.',
        model,
      });
      return;
    }

    response.json({
      result,
      model,
      done: data.done ?? true,
    });
  } catch {
    response.status(503).json({
      error: 'Could not connect to Ollama. Confirm `ollama serve` is running on http://localhost:11434.',
    });
  }
});

app.get('/api/google-sheets/health', async (_request, response) => {
  try {
    const sheets = await getSheetsClient();
    await ensureSheetHeaders(sheets);
    response.json({ ok: true, spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID, sheetName });
  } catch (error) {
    response.status(503).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Google Sheets is not configured.',
    });
  }
});

app.get('/api/google-sheets/latest', async (_request, response) => {
  try {
    const latest = await readLatestCompletedRun();
    if (!latest?.result) {
      response.status(404).json({ error: 'No result found in Google Sheets yet.' });
      return;
    }

    response.json(latest);
  } catch (error) {
    response.status(503).json({
      error: error instanceof Error ? error.message : 'Could not read Google Sheets result.',
    });
  }
});

app.post('/api/remote-ai/run', async (request, response) => {
  const { model, prompt } = request.body ?? {};

  if (!model || typeof model !== 'string') {
    response.status(400).json({ error: 'Missing Ollama model name.' });
    return;
  }

  if (!prompt || typeof prompt !== 'string') {
    response.status(400).json({ error: 'Missing prompt.' });
    return;
  }

  try {
    const run = await createRemoteRun({ model, prompt });
    response.status(202).json(run);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Could not create Remote AI run.',
    });
  }
});

app.get('/api/remote-ai/status', async (request, response) => {
  const runId = request.query.runId;

  if (!runId || typeof runId !== 'string') {
    response.status(400).json({ error: 'Missing runId.' });
    return;
  }

  try {
    const run = await getRemoteRun(runId);
    if (!run) {
      response.status(404).json({ error: 'Remote AI run not found.' });
      return;
    }

    response.json(run);
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Could not read Remote AI run.',
    });
  }
});

app.use(express.static(distPath));

app.get('*', (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Structured Discovery Agent server running on http://localhost:${port}`);
  console.log(`Proxying Ollama requests to ${ollamaBaseUrl}`);
});

async function generateOllamaResult(model, prompt) {
  const ollamaResponse = await fetch(`${ollamaBaseUrl}/api/generate`, {
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

  if (!ollamaResponse.ok) {
    const text = await ollamaResponse.text();
    throw new Error(text || 'Ollama generation failed.');
  }

  const data = await ollamaResponse.json();
  const result = data.response ?? '';

  if (!result.trim()) {
    throw new Error('Ollama returned an empty response. Nothing was written as the completed result.');
  }

  return result;
}
