import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const raw = await readFile(new URL('../src/api/supabase/databankCalls.ts', import.meta.url), 'utf8');
const source = raw.replace('import { supabase } from "../../lib/supabase";', 'const supabase = globalThis.__libraryTestClient;');
let sequence = 0;
async function moduleFor(rows, existingError = null) {
  const writes = [];
  const chain = {
    select: () => chain,
    eq: () => chain,
    limit: async () => ({ data: rows, error: existingError }),
    update: payload => { writes.push({ action: 'update', payload }); return chain; },
    insert: payload => { writes.push({ action: 'insert', payload }); return chain; },
    then: resolve => Promise.resolve({ data: [], error: null }).then(resolve),
  };
  globalThis.__libraryTestClient = { auth: { getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }) }, from: () => chain };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const api = await import(`data:text/javascript;base64,${Buffer.from(compiled + '\n//' + sequence++).toString('base64')}`);
  return { api, writes };
}
test('removing a favorite updates only the flag and preserves tracking data', async () => {
  const { api, writes } = await moduleFor([{ anime_id: 21 }]);
  await api.toggleFavorite(21, true);
  assert.deepEqual(writes, [{ action: 'update', payload: { favorite: false } }]);
});
test('a failed existence check never inserts a duplicate favorite', async () => {
  const { api, writes } = await moduleFor(null, { message: 'Database unavailable' });
  const result = await api.toggleFavorite(21, false);
  assert.equal(result.error.message, 'Database unavailable');
  assert.deepEqual(writes, []);
});
test('a note on a new title uses a valid planned status without silently favoriting it', async () => {
  const { api, writes } = await moduleFor([]);
  await api.saveEpisodeNote(21, 1, '  A memorable beginning  ');
  assert.equal(writes[0].payload.status, 'planned');
  assert.equal(writes[0].payload.favorite, false);
  assert.deepEqual(writes[0].payload.episode_notes, { 1: 'A memorable beginning' });
});
test('clearing one note preserves notes on the other episodes', async () => {
  const { api, writes } = await moduleFor([{ anime_id: 21, episode_notes: { 1: 'First', 2: 'Second' } }]);
  await api.saveEpisodeNote(21, 1, '');
  assert.deepEqual(writes, [{ action: 'update', payload: { episode_notes: { 2: 'Second' } } }]);
});
