import { createHash } from 'node:crypto';
export { Fault, fail, transition, searchMessages } from '../shared/workspace.mjs';
export const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
