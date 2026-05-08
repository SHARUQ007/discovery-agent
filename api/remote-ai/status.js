import { getRemoteRun } from '../../server/sheetsStore.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed.' });
    return;
  }

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
}
