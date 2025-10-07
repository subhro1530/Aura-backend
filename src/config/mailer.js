const nodemailer = require("nodemailer");
const logger = require("./logger");

let transporter;
let resendClient;

function buildTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    transporter = {
      sendMail: async (opts) => {
        logger.info("[MAIL:FAKE]", opts);
        return { messageId: "dev-fake" };
      },
    };
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Add Resend path
async function sendMail({ to, subject, html }) {
  if (process.env.RESEND_API_KEY) {
    if (!resendClient) {
      const { Resend } = require("resend");
      resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    try {
      const from = process.env.EMAIL_FROM || "Aura <no-reply@aura.local>";
      const resp = await resendClient.emails.send({ from, to, subject, html });
      return resp;
    } catch (e) {
      logger.warn("Resend failed, falling back to transporter", {
        error: e.message,
      });
    }
  }
  const mailer = buildTransporter();
  const from = process.env.EMAIL_FROM || "Aura <no-reply@aura.local>";
  return mailer.sendMail({ from, to, subject, html });
}

module.exports = { sendMail };
