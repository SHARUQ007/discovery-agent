interface RemoteRun {
  runId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export async function runRemoteAiPrompt(model: string, prompt: string): Promise<string> {
  const created = await createRemoteRun(model, prompt);
  const startedAt = Date.now();
  const timeoutMs = 15 * 60 * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    await wait(3000);
    const run = await getRemoteRun(created.runId);

    if (run.status === 'completed') {
      if (!run.result?.trim()) {
        throw new Error('Remote AI completed without a result in Google Sheets.');
      }

      return run.result;
    }

    if (run.status === 'failed') {
      throw new Error(run.error || 'Remote AI worker failed.');
    }
  }

  throw new Error('Remote AI timed out waiting for the Mac worker to complete the Google Sheets job.');
}

async function createRemoteRun(model: string, prompt: string): Promise<RemoteRun> {
  const response = await fetch(`${getApiBaseUrl()}/api/remote-ai/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? 'Could not create Remote AI job.');
  }

  return data;
}

async function getRemoteRun(runId: string): Promise<RemoteRun> {
  const response = await fetch(`${getApiBaseUrl()}/api/remote-ai/status?runId=${encodeURIComponent(runId)}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? 'Could not read Remote AI job status.');
  }

  return data;
}

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_REMOTE_AI_API_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  return '';
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
