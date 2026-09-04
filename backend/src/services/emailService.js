import nodemailer from "nodemailer";

let transporter;

// Without SMTP credentials the app still works: links are printed to the server console.
function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[email] SMTP_USER/SMTP_PASS are not set - emails will be printed to the console instead of sent.");
    transporter = null;
    return transporter;
  }
  const port = Number(SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

const appUrl = () => (process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

function layout(heading, body, action) {
  return `<div style="font-family:Georgia,'Times New Roman',serif;background:#f6f4ef;padding:32px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
    <div style="background:#0b2c2d;color:#fff;padding:20px 28px"><h1 style="margin:0;font-size:20px">GHALIB Restaurant</h1></div>
    <div style="padding:28px;color:#22312f;line-height:1.6">
      <h2 style="margin:0 0 12px;font-size:18px">${heading}</h2>
      <p style="margin:0 0 24px">${body}</p>
      <a href="${action.href}" style="display:inline-block;background:#cdb894;color:#0b2c2d;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold">${action.label}</a>
      <p style="margin:24px 0 0;font-size:13px;color:#6b7a77">If the button does not work, paste this link into your browser:<br>${action.href}</p>
    </div>
  </div>
</div>`;
}

// Delivery problems are logged, never thrown: a flaky mailbox must not fail a signup.
async function send({ to, subject, text, html }) {
  const mailer = getTransporter();
  if (!mailer) {
    if (process.env.NODE_ENV === "development") {
      console.info(`\n[email] to: ${to}\n[email] subject: ${subject}\n[email] ${text}\n`);
    } else {
      console.error(`[email] delivery skipped for "${subject}": SMTP is not configured`);
    }
    return;
  }
  try {
    await mailer.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
  } catch (error) {
    console.error(`[email] delivery failed for "${subject}" (${error.code || "unknown error"})`);
  }
}

export function sendVerificationEmail(user, token, next) {
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? `&next=${encodeURIComponent(next)}` : "";
  const href = `${appUrl()}/verify-email?token=${token}${safeNext}`;
  return send({
    to: user.email,
    subject: "Verify your GHALIB Restaurant account",
    text: `Verify your email address: ${href}`,
    html: layout("Welcome to GHALIB", `Hi ${user.name}, confirm your email address to start placing orders. This link expires in 24 hours.`, { href, label: "Verify email" }),
  });
}

export function sendPasswordResetEmail(user, token) {
  const href = `${appUrl()}/reset-password?token=${token}`;
  return send({
    to: user.email,
    subject: "Reset your GHALIB Restaurant password",
    text: `Reset your password: ${href}`,
    html: layout("Password reset", `Hi ${user.name}, use the button below to choose a new password. This link expires in 1 hour. If you did not request it, you can ignore this email.`, { href, label: "Reset password" }),
  });
}

export function sendOrderConfirmationEmail(user, order) {
  const href = `${appUrl()}/orders/${order._id}`;
  const lines = order.items.map((item) => `${item.quantity} x ${item.name} - Rs ${item.lineTotal}`).join("\n");
  return send({
    to: user.email,
    subject: `Order ${order.orderNumber} received`,
    text: `We received your order ${order.orderNumber}.\n\n${lines}\n\nTotal: Rs ${order.total}\n\nTrack it here: ${href}`,
    html: layout(`Order ${order.orderNumber} received`, `Thanks ${user.name}! We are preparing your order.<br><br>${order.items.map((item) => `${item.quantity} &times; ${item.name} &mdash; Rs ${item.lineTotal}`).join("<br>")}<br><br><strong>Total: Rs ${order.total}</strong>`, { href, label: "Track order" }),
  });
}

export function sendOrderStatusUpdateEmail(user, order) {
  // Do not send email notification for 'preparing' ("Being Prepared in the Kitchen")
  if (order.status === "preparing") {
    return Promise.resolve();
  }

  const href = `${appUrl()}/orders/${order._id}`;
  const statusLabels = {
    confirmed: "Confirmed",
    ready: "Ready for Delivery",
    completed: "Delivered & Completed",
    cancelled: "Cancelled / Rejected",
  };
  const label = statusLabels[order.status] || order.status;
  const isCancelled = order.status === "cancelled";

  const heading = isCancelled
    ? `Order ${order.orderNumber} &mdash; Cancelled`
    : `Order ${order.orderNumber} &mdash; ${label}`;

  const bodyText = isCancelled
    ? `Hi ${user.name},<br><br>We regret to inform you that your order <strong>${order.orderNumber}</strong> has been cancelled/rejected by the restaurant.<br><br><strong>Order Total: Rs ${order.total}</strong>`
    : `Hi ${user.name},<br><br>Good news! Your order <strong>${order.orderNumber}</strong> has been updated to: <strong>${label}</strong>.<br><br><strong>Order Total: Rs ${order.total}</strong>`;

  return send({
    to: user.email,
    subject: `Order ${order.orderNumber} status update: ${label}`,
    text: isCancelled
      ? `Hi ${user.name}, your order ${order.orderNumber} has been cancelled/rejected.\n\nView details: ${href}`
      : `Hi ${user.name}, your order ${order.orderNumber} is now: ${label}.\n\nView details: ${href}`,
    html: layout(heading, bodyText, { href, label: "Track Order" }),
  });
}

