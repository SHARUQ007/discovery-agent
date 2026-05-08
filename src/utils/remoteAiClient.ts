export async function runRemoteAiPrompt(model: string, prompt: string): Promise<string> {
  const response = await fetch(`${getRemoteBridgeBaseUrl()}/api/remote-ai/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? 'Remote AI run failed.');
  }

  if (!data.result?.trim()) {
    throw new Error('Remote AI completed without a result in Google Sheets.');
  }

  return data.result;
}

function getRemoteBridgeBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_REMOTE_AI_BRIDGE_URL || import.meta.env.VITE_OLLAMA_PROXY_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const isLocalFrontend = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  return isLocalFrontend ? '' : 'http://localhost:8787';
}
