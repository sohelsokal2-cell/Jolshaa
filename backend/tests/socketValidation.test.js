const test = require('node:test');
const assert = require('node:assert/strict');
const { validateNotificationPayload, normalizeNotificationType } = require('../utils/socketValidation');

test('accepts valid notification payloads', () => {
  const result = validateNotificationPayload({
    recipientId: '507f1f77bcf86cd799439011',
    type: 'comment',
    relatedPost: '507f1f77bcf86cd799439012',
  });

  assert.equal(result.ok, true);
  assert.equal(result.type, 'comment');
  assert.equal(result.relatedPost, '507f1f77bcf86cd799439012');
});

test('rejects invalid notification types', () => {
  const result = validateNotificationPayload({
    recipientId: '507f1f77bcf86cd799439011',
    type: 'hacked',
  });

  assert.equal(result.ok, false);
  assert.equal(result.message, 'Invalid notification type');
});

test('normalizes unknown types to notification', () => {
  assert.equal(normalizeNotificationType('unknown'), 'notification');
});
