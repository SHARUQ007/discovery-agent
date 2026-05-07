import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
    response.json({
      result: data.response ?? '',
      model,
      done: data.done ?? true,
    });
  } catch {
    response.status(503).json({
      error: 'Could not connect to Ollama. Confirm `ollama serve` is running on http://localhost:11434.',
    });
  }
});

app.use(express.static(distPath));

app.get('*', (_request, response) => {
  response.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Signal Discovery Agent server running on http://localhost:${port}`);
  console.log(`Proxying Ollama requests to ${ollamaBaseUrl}`);
});
