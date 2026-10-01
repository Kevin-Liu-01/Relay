import { fail, transition, searchMessages } from '../../shared/workspace.mjs';

// A hands-on demo, not a trainer session or a benchmark result. Nothing persists.
export function createPlaySession(initial) {
  let state = structuredClone(initial),
    revision = 0;
  const receipts = new Map();
  return {
    request(path, method = 'GET', body) {
      const url = new URL(path, 'https://sandbox.invalid/');
      if (method === 'GET' && url.pathname === '/state')
        return structuredClone({ state, revision });
      if (method === 'GET' && url.pathname === '/search')
        return {
          messages: structuredClone(searchMessages(state, url.searchParams.get('q') ?? '')),
        };
      if (method === 'POST' && url.pathname === '/action') {
        fail(
          typeof body?.requestId === 'string' && body.requestId.length <= 100,
          'Invalid request.',
        );
        const action = JSON.stringify(body.action),
          previous = receipts.get(body.requestId);
        if (previous) {
          fail(previous.action === action, 'Request ID already used.', 409);
          return { revision: previous.revision };
        }
        fail(body.revision === revision, 'Workspace changed. Please try again.', 409);
        fail(revision < 1000, 'Sandbox is full. Reset the workspace to continue.');
        state = transition(state, body.action, revision + 1);
        revision++;
        receipts.set(body.requestId, { action, revision });
        return { revision };
      }
      throw new Error('This operation is not available in the hands-on sandbox.');
    },
  };
}
