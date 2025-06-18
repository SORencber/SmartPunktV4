const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { Client: WhatsAppClient, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// Email config (adjust as needed)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio config (adjust as needed)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

// WhatsApp config (headless, QR code must be scanned once)
const whatsappClients = {};
const whatsappReadyMap = {};
const latestQrCodes = {};

function initWhatsApp(whatsappUser = 'default') {
  if (whatsappClients[whatsappUser]) return whatsappClients[whatsappUser];
  const client = new WhatsAppClient({
    authStrategy: new LocalAuth({
      clientId: `whatsapp-session-${whatsappUser}`
    })
  });
  client.on('qr', (qr) => {
    latestQrCodes[whatsappUser] = qr;
    console.log(`WhatsApp QR code for ${whatsappUser}:`, qr);
  });
  client.on('ready', () => {
    whatsappReadyMap[whatsappUser] = true;
    latestQrCodes[whatsappUser] = null;
    console.log(`WhatsApp client is ready for ${whatsappUser}!`);
  });
  client.initialize();
  whatsappClients[whatsappUser] = client;
  return client;
}

function getLatestQrCode(whatsappUser = 'default') {
  return latestQrCodes[whatsappUser] || null;
}

function isWhatsAppReady(whatsappUser = 'default') {
  return !!whatsappReadyMap[whatsappUser];
}

// Helper: Format message with branch info
function formatMessageGerman({ message, branchInfo }) {
  return `${message}\n\nFiliale: ${branchInfo?.name || ''}\nAdresse: ${branchInfo?.address || ''}`;
}

/**
 * Send message via selected channels
 * @param {Object} opts
 * @param {string} opts.to - Recipient (email, phone, or WhatsApp number)
 * @param {Array<'email'|'sms'|'whatsapp'>} opts.channels - Channels to send
 * @param {string} opts.message - Message content (German)
 * @param {Object} opts.branchInfo - Branch info (name, address)
 * @param {string} [opts.email] - Email address (for email)
 * @param {string} [opts.phone] - Phone number (for SMS)
 * @param {string} [opts.whatsapp] - WhatsApp number (for WhatsApp)
 * @param {string} [opts.whatsappUser] - WhatsApp user (for WhatsApp)
 */
async function sendMessage({ to, channels, message, branchInfo, email, phone, whatsapp, whatsappUser = 'default' }) {
  const results = {};
  const formattedMessage = formatMessageGerman({ message, branchInfo });

  if (channels.includes('email') && email) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Ihre Reparatur ist eingetroffen',
        text: formattedMessage,
      });
      results.email = true;
    } catch (err) {
      results.email = false;
      results.emailError = err.message;
    }
  }

  if (channels.includes('sms') && phone) {
    try {
      await twilioClient.messages.create({
        body: formattedMessage,
        from: twilioFrom,
        to: phone.startsWith('+') ? phone : `+${phone}`,
      });
      results.sms = true;
    } catch (err) {
      results.sms = false;
      results.smsError = err.message;
    }
  }

  if (channels.includes('whatsapp') && whatsapp) {
    try {
      const client = initWhatsApp(whatsappUser);
      if (!isWhatsAppReady(whatsappUser)) throw new Error('WhatsApp client not ready');
      await client.sendMessage(whatsapp, formattedMessage);
      results.whatsapp = true;
    } catch (err) {
      results.whatsapp = false;
      results.whatsappError = err.message;
    }
  }

  return results;
}

module.exports = {
  sendMessage,
  initWhatsApp,
  getLatestQrCode,
  isWhatsAppReady,
}; 