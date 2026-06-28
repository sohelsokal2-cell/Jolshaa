let admin = null;
let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;

  const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
    console.warn('[Push] Firebase not configured. Push notifications will be disabled.');
    return;
  }

  try {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: FIREBASE_CLIENT_EMAIL,
      }),
    });
    firebaseInitialized = true;
    console.log('[Push] Firebase initialized successfully');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.warn('[Push] firebase-admin not installed. Run: npm install firebase-admin');
    } else {
      console.error('[Push] Firebase init error:', error.message);
    }
  }
};

const sendPushNotification = async ({ token, title, body, data, imageUrl }) => {
  if (!firebaseInitialized) {
    console.warn('[Push] Firebase not initialized. Skipping push notification.');
    return { sent: false, reason: 'firebase_not_configured' };
  }

  try {
    const message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: data?.link || process.env.CLIENT_URL || 'http://localhost:3000',
        },
        notification: {
          title,
          body,
          icon: '/logo192.png',
          badge: '/badge-icon.png',
          ...(imageUrl && { image: imageUrl }),
        },
      },
    };

    const response = await admin.messaging().send(message);
    return { sent: true, messageId: response };
  } catch (error) {
    console.error('[Push] Send error:', error.message);
    return { sent: false, error: error.message };
  }
};

const sendBulkPushNotification = async ({ tokens, title, body, data, imageUrl }) => {
  if (!firebaseInitialized || !tokens.length) {
    return { sent: false, reason: 'not_configured_or_no_tokens' };
  }

  try {
    const message = {
      tokens,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: data?.link || process.env.CLIENT_URL || 'http://localhost:3000',
        },
        notification: {
          title,
          body,
          icon: '/logo192.png',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    return {
      sent: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('[Push] Bulk send error:', error.message);
    return { sent: false, error: error.message };
  }
};

const subscribeToTopic = async (token, topic) => {
  if (!firebaseInitialized) return { success: false };
  try {
    await admin.messaging().subscribeToTopic(token, topic);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  initFirebase,
  sendPushNotification,
  sendBulkPushNotification,
  subscribeToTopic,
};
