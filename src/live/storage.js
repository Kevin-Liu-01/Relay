function database() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('relay-history-v1', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('runs', { keyPath: 'id' });
      req.result.createObjectStore('summaries', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function access(names, mode, fn) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(names, mode);
    let result;
    const request = fn(tx);
    if (request)
      request.onsuccess = () => {
        result = request.result;
      };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const history = () =>
  access(['summaries'], 'readonly', (tx) => tx.objectStore('summaries').getAll());
export const readRun = (id) => access(['runs'], 'readonly', (tx) => tx.objectStore('runs').get(id));
export const saveRun = (record) =>
  access(['runs', 'summaries'], 'readwrite', (tx) => {
    // Only explicit evidence fields are persisted. Connection state/keys never enter this module.
    const value = {
      id: record.run.id,
      run: record.run,
      audit: record.audit ?? null,
      events: record.events,
      artifacts: record.artifacts,
      capturedAt: new Date().toISOString(),
      error: record.error ?? null,
      duel: record.duel ?? null,
      batch: record.batch ?? null,
    };
    tx.objectStore('runs').put(value);
    tx.objectStore('summaries').put({
      id: value.id,
      run: value.run,
      capturedAt: value.capturedAt,
      completeAudit: !!value.audit,
      error: value.error,
      duel: value.duel,
      batch: value.batch,
    });
  });
export const deleteRun = (id) =>
  access(['runs', 'summaries'], 'readwrite', (tx) => {
    tx.objectStore('runs').delete(id);
    tx.objectStore('summaries').delete(id);
  });
export function downloadEvidence(record) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob),
    link = document.createElement('a');
  link.href = url;
  link.download = `relay-${record.run.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
