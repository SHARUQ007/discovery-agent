function getOllamaProxyBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_OLLAMA_PROXY_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const isLocalFrontend = ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  return isLocalFrontend ? '' : 'http://localhost:8787';
}

export async function runOllamaPrompt(model: string, prompt: string): Promise<string> {
  const response = await fetch(`${getOllamaProxyBaseUrl()}/api/ollama/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? 'Ollama generation failed.');
  }

  return data.result ?? '';
}
