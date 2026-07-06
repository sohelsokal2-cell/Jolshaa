const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const NotificationPreference = require('../models/NotificationPreference');

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) {
    console.warn('[Email] SMTP not configured. Emails will be logged but not sent.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_PORT === '465',
    requireTLS: true,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return transporter;
};

const templates = {
  welcome: (data) => ({
    subject: `Welcome to Jolshaa, ${data.name}!`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>Welcome to Jolshaa!</h2>
      <p>Hi ${data.name},</p>
      <p>Your account has been created successfully. Start exploring and connecting!</p>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/feed" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;margin-top:12px">Go to Feed</a>
    </div>`,
  }),
  tip_received: (data) => ({
    subject: `You received a ৳${data.amount} tip!`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>New Tip Received!</h2>
      <p>Hi ${data.recipientName},</p>
      <p><strong>${data.senderName}</strong> sent you a <strong>৳${data.amount}</strong> tip${data.message ? `: "${data.message}"` : ''}.</p>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/creator/earnings" style="display:inline-block;padding:12px 24px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;margin-top:12px">View Earnings</a>
    </div>`,
  }),
  subscription_new: (data) => ({
    subject: `New subscriber: ${data.subscriberName}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>New Subscriber!</h2>
      <p>Hi ${data.creatorName},</p>
      <p><strong>${data.subscriberName}</strong> subscribed to your ${data.planName} plan ($${data.price}/${data.interval}).</p>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/creator/earnings" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;margin-top:12px">View Earnings</a>
    </div>`,
  }),
  payout_processed: (data) => ({
    subject: `Payout of $${data.amount} processed`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>Payout Processed</h2>
      <p>Hi ${data.creatorName},</p>
      <p>Your payout of <strong>$${data.amount}</strong> has been processed via ${data.paymentMethod}.</p>
      <p>Period: ${data.periodFrom} - ${data.periodTo}</p>
    </div>`,
  }),
  password_reset: (data) => ({
    subject: 'Reset your Jolshaa password',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2>Password Reset</h2>
      <p>Hi ${data.name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${data.resetUrl}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;margin-top:12px">Reset Password</a>
    </div>`,
  }),
};

const isEmailEnabled = async (userId, notificationType) => {
  try {
    const prefs = await NotificationPreference.findOne({ user: userId });
    if (!prefs || !prefs.emailNotifications) return false;
    const typeMap = {
      tip: 'tips',
      subscription: 'subscriptions',
      payout: 'payouts',
      friend_request: 'friendRequests',
      comment: 'comments',
      reaction: 'reactions',
      mention: 'mentions',
    };
    const key = typeMap[notificationType];
    if (key && prefs.types && prefs.types[key] === false) return false;
    return true;
  } catch {
    return true;
  }
};

const sendEmail = async ({ to, userId, template, data, type = 'email' }) => {
  const logData = { type, to, toUser: userId, template, status: 'queued' };

  try {
    const emailContent = templates[template]?.(data);
    if (!emailContent) {
      logData.status = 'failed';
      logData.error = `Template "${template}" not found`;
      await EmailLog.create(logData);
      return { sent: false, error: logData.error };
    }

    if (userId && !(await isEmailEnabled(userId, template))) {
      logData.status = 'skipped';
      logData.error = 'Email notifications disabled by user';
      await EmailLog.create(logData);
      return { sent: false, reason: 'disabled' };
    }

    const transport = initTransporter();
    if (!transport) {
      logData.status = 'queued';
      logData.metadata = { ...data, subject: emailContent.subject };
      await EmailLog.create(logData);
      return { sent: false, reason: 'smtp_not_configured' };
    }

    await transport.sendMail({
      from: process.env.EMAIL_FROM || 'Jolshaa <noreply@jolshaa.com>',
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    logData.status = 'sent';
    logData.sentAt = new Date();
    await EmailLog.create(logData);
    return { sent: true };
  } catch (error) {
    logData.status = 'failed';
    logData.error = error.message;
    logData.failedAt = new Date();
    await EmailLog.create(logData).catch(() => {});
    return { sent: false, error: error.message };
  }
};

module.exports = { sendEmail, templates, initTransporter };
