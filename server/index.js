import 'dotenv/config';
import express from 'express';
import { google } from 'googleapis';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME ?? 'SignalDiscoveryRuns';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '../dist');
const sheetHeaders = ['runId', 'createdAt', 'model', 'status', 'promptPreview', 'result'];

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
    const latest = await readLatestSheetResult();
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

  const runId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    const sheets = await getSheetsClient();
    await ensureSheetHeaders(sheets);
    await appendSheetRun(sheets, [runId, createdAt, model, 'running', prompt.slice(0, 500), '']);

    const result = await generateOllamaResult(model, prompt);
    await appendSheetRun(sheets, [runId, new Date().toISOString(), model, 'completed', prompt.slice(0, 500), result]);

    const latest = await readLatestSheetResult();

    response.json({
      runId,
      model,
      result: latest?.result || result,
      source: 'google-sheets',
    });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Remote AI run failed.',
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

async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Missing Google Sheets env vars. Fill GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await auth.authorize();

  return google.sheets({
    version: 'v4',
    auth,
  });
}

async function ensureSheetHeaders(sheets) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    const current = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:F1`,
    });

    if ((current.data.values?.[0] ?? []).join('|') === sheetHeaders.join('|')) {
      return;
    }
  } catch {
    await createSheetIfMissing(sheets);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [sheetHeaders],
    },
  });
}

async function createSheetIfMissing(sheets) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = spreadsheet.data.sheets?.some((sheet) => sheet.properties?.title === sheetName);

  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        },
      ],
    },
  });
}

async function appendSheetRun(sheets, row) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${sheetName}!A:F`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
  });
}

async function readLatestSheetResult() {
  const sheets = await getSheetsClient();
  await ensureSheetHeaders(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${sheetName}!A2:F`,
  });

  const rows = response.data.values ?? [];
  const latestCompleted = [...rows].reverse().find((row) => row[3] === 'completed' && row[5]);

  if (!latestCompleted) return null;

  return {
    runId: latestCompleted[0],
    createdAt: latestCompleted[1],
    model: latestCompleted[2],
    status: latestCompleted[3],
    promptPreview: latestCompleted[4],
    result: latestCompleted[5],
  };
}
