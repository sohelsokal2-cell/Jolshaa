const { Types } = require('mongoose');

const ALLOWED_NOTIFICATION_TYPES = ['comment', 'like', 'message', 'notification', 'follow', 'reply', 'system'];

const isValidObjectId = (value) => {
  if (value === undefined || value === null) return false;
  if (value instanceof Types.ObjectId) return true;
  if (typeof value !== 'string') return false;
  return Types.ObjectId.isValid(value);
};

const normalizeNotificationType = (type) => {
  return ALLOWED_NOTIFICATION_TYPES.includes(type) ? type : 'notification';
};

const validateNotificationPayload = ({ recipientId, type, relatedPost, relatedComment, relatedConversation }) => {
  if (!recipientId) {
    return { ok: false, message: 'Recipient is required' };
  }

  if (!isValidObjectId(recipientId)) {
    return { ok: false, message: 'Invalid recipient id' };
  }

  if (type !== undefined && type !== null && !ALLOWED_NOTIFICATION_TYPES.includes(type)) {
    return { ok: false, message: 'Invalid notification type' };
  }

  if (relatedPost !== undefined && relatedPost !== null && !isValidObjectId(relatedPost)) {
    return { ok: false, message: 'Invalid related post id' };
  }

  if (relatedComment !== undefined && relatedComment !== null && !isValidObjectId(relatedComment)) {
    return { ok: false, message: 'Invalid related comment id' };
  }

  if (relatedConversation !== undefined && relatedConversation !== null && !isValidObjectId(relatedConversation)) {
    return { ok: false, message: 'Invalid related conversation id' };
  }

  return {
    ok: true,
    type: normalizeNotificationType(type),
    relatedPost: relatedPost || null,
    relatedComment: relatedComment || null,
    relatedConversation: relatedConversation || null,
  };
};

module.exports = {
  ALLOWED_NOTIFICATION_TYPES,
  isValidObjectId,
  normalizeNotificationType,
  validateNotificationPayload,
};
