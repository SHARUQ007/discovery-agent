import { createRemoteRun } from '../../server/sheetsStore.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

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
}
