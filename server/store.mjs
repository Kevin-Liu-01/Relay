import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { makeSeed } from './seed.mjs';
import { digest, fail, transition } from './domain.mjs';
import { taskSpec, grade } from './tasks.mjs';

export class Store {
  constructor(root, { ttlMs = 86_400_000, maxSessions = 256 } = {}) {
    this.root = root;
    this.ttlMs = ttlMs;
    this.maxSessions = maxSessions;
    mkdirSync(root, { recursive: true, mode: 0o700 });
  }
  path(token) {
    fail(typeof token === 'string' && /^[a-f0-9]{64}$/.test(token), 'Invalid session.', 401);
    return join(this.root, `${digest(token)}.sqlite`);
  }
  withDb(token, fn) {
    const path = this.path(token);
    let db;
    try {
      statSync(path);
    } catch {
      fail(false, 'Session not found or expired.', 404);
    }
    try {
      db = new DatabaseSync(path);
      db.exec('PRAGMA busy_timeout=5000');
      const meta = JSON.parse(db.prepare('SELECT value FROM meta').get().value);
      fail(meta.expiresAt > Date.now(), 'Session expired.', 410);
      return fn(db, meta);
    } finally {
      db?.close();
    }
  }
  create({ taskId = 'thread-reply', seed = 42, mode = 'evaluation' } = {}) {
    fail(
      Number.isSafeInteger(seed) && seed >= 0 && seed <= 1_000_000_000,
      'Seed must be an integer from 0 to 1000000000.',
    );
    const task = taskSpec(taskId, seed);
    this.sweep();
    fail(
      readdirSync(this.root).filter((x) => x.endsWith('.sqlite')).length < this.maxSessions,
      'Session capacity reached. Close unused sessions.',
      429,
    );
    const token = randomBytes(32).toString('hex');
    const db = new DatabaseSync(this.path(token));
    const meta = {
      id: randomUUID(),
      taskId,
      seed,
      mode,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
    };
    try {
      db.exec(
        'PRAGMA journal_mode=DELETE; CREATE TABLE meta(value TEXT NOT NULL); CREATE TABLE state(id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, value TEXT NOT NULL); CREATE TABLE events(seq INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT NOT NULL); CREATE TABLE requests(id TEXT PRIMARY KEY, hash TEXT NOT NULL, revision INTEGER NOT NULL);',
      );
      db.prepare('INSERT INTO meta VALUES (?)').run(JSON.stringify(meta));
      db.prepare('INSERT INTO state VALUES (1,0,?)').run(JSON.stringify(makeSeed(seed)));
    } finally {
      db.close();
    }
    return { token, ...meta, task };
  }
  read(token) {
    return this.withDb(token, (db) => {
      const r = db.prepare('SELECT revision,value FROM state WHERE id=1').get();
      return { revision: r.revision, state: JSON.parse(r.value) };
    });
  }
  action(token, body) {
    fail(body && typeof body === 'object', 'Expected an action object.');
    fail(
      typeof body.requestId === 'string' && /^[\w-]{8,100}$/.test(body.requestId),
      'A valid requestId is required.',
    );
    fail(Number.isSafeInteger(body.revision), 'A revision is required.');
    return this.withDb(token, (db) => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const hash = digest(body.action),
          prior = db.prepare('SELECT hash,revision FROM requests WHERE id=?').get(body.requestId);
        if (prior) {
          fail(prior.hash === hash, 'Idempotency key reused for a different action.', 409);
          db.exec('COMMIT');
          return { revision: prior.revision, replayed: true };
        }
        const r = db.prepare('SELECT revision,value FROM state WHERE id=1').get();
        fail(r.revision === body.revision, 'Workspace changed. Please retry your action.', 409);
        const before = JSON.parse(r.value),
          state = transition(before, body.action, r.revision + 1);
        const event = {
          kind: 'mutation',
          revision: r.revision + 1,
          action: body.action,
          beforeHash: digest(before),
          afterHash: digest(state),
          at: new Date().toISOString(),
        };
        db.prepare('UPDATE state SET revision=?,value=? WHERE id=1').run(
          r.revision + 1,
          JSON.stringify(state),
        );
        db.prepare('INSERT INTO events(value) VALUES (?)').run(JSON.stringify(event));
        db.prepare('INSERT INTO requests VALUES (?,?,?)').run(body.requestId, hash, r.revision + 1);
        db.exec('COMMIT');
        return { revision: r.revision + 1, replayed: false };
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    });
  }
  uiEvent(token, event) {
    fail(
      event && ['click', 'keydown', 'submit', 'navigate', 'search'].includes(event.type),
      'Invalid UI event.',
    );
    // Diagnostic only: never contributes to reward. Payload is deliberately bounded.
    const value = {
      kind: 'interaction',
      type: event.type,
      label: String(event.label ?? '').slice(0, 160),
      key: String(event.key ?? '').slice(0, 40),
      x: Number.isFinite(event.x) ? event.x : null,
      y: Number.isFinite(event.y) ? event.y : null,
      at: new Date().toISOString(),
    };
    return this.withDb(token, (db) => {
      fail(
        db.prepare('SELECT COUNT(*) AS n FROM events').get().n < 10000,
        'Trajectory event limit reached.',
        429,
      );
      db.prepare('INSERT INTO events(value) VALUES (?)').run(JSON.stringify(value));
      return { ok: true };
    });
  }
  reset(token) {
    return this.withDb(token, (db, meta) => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const old = db.prepare('SELECT revision FROM state WHERE id=1').get();
        const state = makeSeed(meta.seed);
        db.prepare('UPDATE state SET revision=?,value=?').run(
          old.revision + 1,
          JSON.stringify(state),
        );
        db.prepare('INSERT INTO events(value) VALUES (?)').run(
          JSON.stringify({
            kind: 'reset',
            revision: old.revision + 1,
            at: new Date().toISOString(),
          }),
        );
        db.exec('DELETE FROM requests; COMMIT');
        return { revision: old.revision + 1, state };
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    });
  }
  evaluate(token) {
    return this.withDb(token, (db, meta) => {
      const r = db.prepare('SELECT revision,value FROM state').get();
      return {
        ...grade(meta.taskId, meta.seed, JSON.parse(r.value)),
        revision: r.revision,
        sessionId: meta.id,
      };
    });
  }
  export(token) {
    return this.withDb(token, (db, meta) => ({
      schemaVersion: 1,
      session: meta,
      task: taskSpec(meta.taskId, meta.seed),
      ...this.read(token),
      evaluation: this.evaluate(token),
      events: db
        .prepare('SELECT seq,value FROM events ORDER BY seq')
        .all()
        .map((r) => ({ seq: r.seq, ...JSON.parse(r.value) })),
    }));
  }
  close(token) {
    this.withDb(token, () => {});
    unlinkSync(this.path(token));
    return { closed: true };
  }
  sweep() {
    for (const f of readdirSync(this.root).filter((f) => /^[a-f0-9]{64}\.sqlite$/.test(f))) {
      const p = join(this.root, f);
      const db = new DatabaseSync(p);
      let expired = false;
      try {
        expired =
          JSON.parse(db.prepare('SELECT value FROM meta').get().value).expiresAt <= Date.now();
      } finally {
        db.close();
      }
      if (expired) unlinkSync(p);
    }
  }
}
