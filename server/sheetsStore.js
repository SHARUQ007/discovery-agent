import 'dotenv/config';
import { google } from 'googleapis';

export const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME ?? 'StructuredDiscoveryRuns';
export const sheetHeaders = ['runId', 'createdAt', 'updatedAt', 'model', 'status', 'prompt', 'promptPreview', 'result', 'error'];

export async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error('Missing Google Sheets env vars. Fill GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY.');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await auth.authorize();

  return google.sheets({ version: 'v4', auth });
}

export async function ensureSheetHeaders(sheets) {
  sheets = sheets ?? await getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    const current = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:I1`,
    });

    if ((current.data.values?.[0] ?? []).join('|') === sheetHeaders.join('|')) return;
  } catch {
    await createSheetIfMissing(sheets);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:I1`,
    valueInputOption: 'RAW',
    requestBody: { values: [sheetHeaders] },
  });
}

export async function createRemoteRun({ model, prompt }) {
  const sheets = await getSheetsClient();
  await ensureSheetHeaders(sheets);

  const runId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${sheetName}!A:I`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[runId, now, now, model, 'pending', prompt, prompt.slice(0, 500), '', '']],
    },
  });

  return { runId, createdAt: now, updatedAt: now, model, status: 'pending' };
}

export async function getRemoteRun(runId) {
  const { rows } = await readRows();
  const match = rows.find((row) => row.runId === runId);
  return match ?? null;
}

export async function getOldestPendingRun() {
  const { rows } = await readRows();
  return rows.find((row) => row.status === 'pending') ?? null;
}

export async function updateRemoteRun(rowNumber, patch) {
  const sheets = await getSheetsClient();
  await ensureSheetHeaders(sheets);

  const existing = await readRow(rowNumber);
  if (!existing) throw new Error(`Run row ${rowNumber} was not found.`);

  const updated = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:I${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        updated.runId,
        updated.createdAt,
        updated.updatedAt,
        updated.model,
        updated.status,
        updated.prompt,
        updated.promptPreview,
        updated.result,
        updated.error,
      ]],
    },
  });

  return updated;
}

export async function readLatestCompletedRun() {
  const { rows } = await readRows();
  return [...rows].reverse().find((row) => row.status === 'completed' && row.result) ?? null;
}

async function readRows() {
  const sheets = await getSheetsClient();
  await ensureSheetHeaders(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${sheetName}!A2:I`,
  });

  const values = response.data.values ?? [];
  return {
    rows: values.map(rowToRun).map((row, index) => ({ ...row, rowNumber: index + 2 })),
  };
}

async function readRow(rowNumber) {
  const sheets = await getSheetsClient();
  await ensureSheetHeaders(sheets);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:I${rowNumber}`,
  });

  const row = response.data.values?.[0];
  return row ? { ...rowToRun(row), rowNumber } : null;
}

function rowToRun(row) {
  return {
    runId: row[0] ?? '',
    createdAt: row[1] ?? '',
    updatedAt: row[2] ?? '',
    model: row[3] ?? '',
    status: row[4] ?? '',
    prompt: row[5] ?? '',
    promptPreview: row[6] ?? '',
    result: row[7] ?? '',
    error: row[8] ?? '',
  };
}

async function createSheetIfMissing(sheets) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = spreadsheet.data.sheets?.some((sheet) => sheet.properties?.title === sheetName);

  if (exists) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: sheetName } } }],
    },
  });
}
