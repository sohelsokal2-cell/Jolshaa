const test = require('node:test');
const assert = require('node:assert/strict');
const { verifyTurnstile } = require('../middleware/verifyTurnstile');

const createRes = () => {
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  return res;
};

test('skips captcha verification when no Turnstile secret is configured', async () => {
  delete process.env.TURNSTILE_SECRET_KEY;

  let nextCalled = false;
  const req = { body: {}, ip: '127.0.0.1' };
  const res = createRes();

  await verifyTurnstile(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
});

test('returns 400 when a Turnstile token is missing and the secret is configured', async () => {
  process.env.TURNSTILE_SECRET_KEY = 'test-secret';

  let nextCalled = false;
  const req = { body: {}, ip: '127.0.0.1' };
  const res = createRes();

  await verifyTurnstile(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.payload.message, 'Captcha verification required');
});
