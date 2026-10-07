const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const source = readFileSync(require('node:path').join(__dirname, '../spotify-soundbar.js'), 'utf8');

async function launch(responses, { cancel = false } = {}) {
  const keychain = new Map([['spotify_refresh_token', 'expired']]);
  const requests = [], alerts = [], removed = [];
  let authorizations = 0, completed = false;
  const context = {
    btoa: value => Buffer.from(value).toString('base64'),
    Keychain: {
      contains: key => keychain.has(key), get: key => keychain.get(key),
      set: (key, value) => keychain.set(key, value),
      remove: key => { removed.push(key); keychain.delete(key); },
    },
    Safari: { open: () => {
      assert.equal(keychain.has('spotify_refresh_token'), false);
      authorizations++;
    } },
    Alert: class {
      addTextField() {} addAction() {} addCancelAction() {}
      textFieldValue() { return 'https://example.com/callback?code=new-code'; }
      async presentAlert() {
        alerts.push(this);
        return this.title === 'Paste the redirect URL' && cancel ? -1 : 0;
      }
    },
    Request: class {
      constructor(url) { this.url = url; requests.push(this); }
      async loadJSON() {
        if (this.url.endsWith('/devices')) {
          return { devices: [{ name: 'Samsung Soundbar', id: 'soundbar' }] };
        }
        assert.ok(responses.length, 'unexpected token request');
        const response = responses.shift();
        if (response instanceof Error) throw response;
        return response;
      }
      async load() {}
    },
    Script: { complete: () => { completed = true; } },
  };
  await runInNewContext(`(async () => { ${source}\n })()`, context);
  assert.equal(completed, true);
  assert.equal(responses.length, 0);
  return { keychain, requests, alerts, removed, authorizations };
}

test('invalid_grant reauthorizes and continues playback in the same launch', async () => {
  const result = await launch([
    { error: 'invalid_grant' },
    { access_token: 'auth-access', refresh_token: 'renewed' },
    { access_token: 'fresh-access', refresh_token: 'rotated' },
  ]);
  assert.equal(result.authorizations, 1);
  assert.equal(result.removed.length, 1);
  assert.equal(result.keychain.get('spotify_refresh_token'), 'rotated');
  assert.deepEqual(result.requests.slice(0, 3).map(r => r.body), [
    'grant_type=refresh_token&refresh_token=expired',
    'grant_type=authorization_code&code=new-code&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback',
    'grant_type=refresh_token&refresh_token=renewed',
  ]);
  assert.equal(result.requests.length, 6);
  for (const request of result.requests.slice(3)) {
    assert.equal(request.headers.Authorization, 'Bearer fresh-access');
  }
  assert.deepEqual(JSON.parse(result.requests[4].body), { device_ids: ['soundbar'], play: true });
  assert.ok(result.requests[5].url.endsWith('/volume?volume_percent=4'));
  assert.equal(result.alerts.length, 1);
});

test('cancelling reauthorization stops playback and leaves no expired token', async () => {
  const result = await launch([{ error: 'invalid_grant' }], { cancel: true });
  assert.equal(result.authorizations, 1);
  assert.equal(result.requests.length, 1);
  assert.equal(result.keychain.size, 0);
  assert.equal(result.alerts.at(-1).message, 'Authorization cancelled.');
});

test('a second invalid_grant stops without an authorization loop', async () => {
  const result = await launch([
    { error: 'invalid_grant' }, { refresh_token: 'renewed' }, { error: 'invalid_grant' },
  ]);
  assert.equal(result.authorizations, 1);
  assert.equal(result.requests.length, 3);
  assert.equal(result.keychain.size, 0);
  assert.equal(result.alerts.at(-1).message, 'Token refresh failed: invalid_grant');
});

test('other refresh errors preserve the token and do not open authorization', async () => {
  for (const response of [{ error: 'invalid_client' }, new Error('Network unavailable')]) {
    const result = await launch([response]);
    assert.equal(result.authorizations, 0);
    assert.equal(result.removed.length, 0);
    assert.equal(result.keychain.get('spotify_refresh_token'), 'expired');
    assert.equal(result.requests.length, 1);
    assert.equal(result.alerts.at(-1).title, 'Something went wrong');
  }
});
