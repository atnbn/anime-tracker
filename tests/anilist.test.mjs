import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
// Compile the real request module without a DOM or external service dependency.
const source = await readFile(new URL('../src/api/anilist/animeList.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const api = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('an empty library never fetches unrelated anime', async () => {
  globalThis.fetch = () => { throw new Error('Unexpected catalog request'); };
  assert.deepEqual(await api.getAnimesFromIds([]), []);
});
test('libraries exceeding 50 IDs are fetched fully and duplicate IDs are removed', async () => {
  const batches = [];
  globalThis.fetch = async (_url, init) => {
    const ids = JSON.parse(init.body).variables.ids;
    batches.push(ids);
    return Response.json({ data: { Page: { media: ids.map(id => ({ id })) } } });
  };
  const ids = Array.from({ length: 61 }, (_, index) => index + 1);
  const result = await api.getAnimesFromIds([...ids, 1, 0, -5]);
  assert.equal(result.length, 61);
  assert.deepEqual(batches.map(batch => batch.length), [50, 11]);
});
test('HTTP success with GraphQL errors remains a failure', async () => {
  globalThis.fetch = async () => Response.json({ errors: [{ message: 'Rate limit exceeded' }] });
  await assert.rejects(api.getGenres(), /Rate limit exceeded/);
});
test('HTTP rate limits produce an actionable error instead of empty results', async () => {
  globalThis.fetch = async () => new Response(null, { status: 429 });
  await assert.rejects(api.getTrendingAnimes(), /try again in a minute/);
});
test('unfiltered Browse omits genre restrictions and retains pagination', async () => {
  let payload;
  globalThis.fetch = async (_url, init) => {
    payload = JSON.parse(init.body);
    return Response.json({ data: { Page: { media: [{ id: 21 }], pageInfo: { total: 100, hasNextPage: true } } } });
  };
  const result = await api.getAnimeByGenre([], 2, 20, 'SCORE_DESC');
  assert.equal(payload.variables.genres, undefined);
  assert.equal(payload.variables.page, 2);
  assert.deepEqual(payload.variables.sort, ['SCORE_DESC']);
  assert.equal(result.pageInfo.hasNextPage, true);
});
test('search forwards its cancellation signal', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.signal, controller.signal);
    return Response.json({ data: { Page: { media: [] } } });
  };
  await api.searchAnimes('Frieren', controller.signal);
});
