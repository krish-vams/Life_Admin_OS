import net from "node:net";
import tls from "node:tls";

function encodeBase64(value) {
  return Buffer.from(String(value), "utf8").toString("base64");
}

function normalizeAddress(value) {
  const match = String(value || "").match(/<([^>]+)>/);
  return (match ? match[1] : String(value || "")).trim();
}

function sanitizeHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";

    function cleanup() {
      socket.off("data", onData);
      socket.off("error", onError);
    }

    function onError(error) {
      cleanup();
      reject(error);
    }

    function onData(chunk) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines.at(-1);

      if (lastLine && /^\d{3} /.test(lastLine)) {
        cleanup();
        resolve(buffer);
      }
    }

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function sendCommand(socket, command, expectedCodes) {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  const code = Number(response.slice(0, 3));

  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed: ${command}`);
  }

  return response;
}

function upgradeToTls(socket) {
  return new Promise((resolve, reject) => {
    const secureSocket = tls.connect({ socket, servername: process.env.SMTP_HOST }, () => {
      resolve(secureSocket);
    });

    secureSocket.once("error", reject);
  });
}

export async function sendSmtpMail({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    return false;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.EMAIL_FROM || "Life Admin OS <no-reply@lifeadmin.local>";
  const fromAddress = normalizeAddress(from);
  const toAddress = normalizeAddress(to);
  let socket = secure
    ? tls.connect({ host: process.env.SMTP_HOST, port, servername: process.env.SMTP_HOST })
    : net.connect({ host: process.env.SMTP_HOST, port });

  await readResponse(socket);
  const ehloResponse = await sendCommand(socket, `EHLO ${process.env.SMTP_HELO_NAME || "life-admin-os.local"}`, [250]);

  if (!secure && process.env.SMTP_DISABLE_STARTTLS !== "true" && /STARTTLS/i.test(ehloResponse)) {
    await sendCommand(socket, "STARTTLS", [220]);
    socket = await upgradeToTls(socket);
    await sendCommand(socket, `EHLO ${process.env.SMTP_HELO_NAME || "life-admin-os.local"}`, [250]);
  }

  if (process.env.SMTP_USER) {
    await sendCommand(socket, "AUTH LOGIN", [334]);
    await sendCommand(socket, encodeBase64(process.env.SMTP_USER), [334]);
    await sendCommand(socket, encodeBase64(process.env.SMTP_PASS || ""), [235]);
  }

  await sendCommand(socket, `MAIL FROM:<${fromAddress}>`, [250]);
  await sendCommand(socket, `RCPT TO:<${toAddress}>`, [250, 251]);
  await sendCommand(socket, "DATA", [354]);

  const message = [
    `From: ${sanitizeHeader(from)}`,
    `To: ${sanitizeHeader(toAddress)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    text,
    "."
  ].join("\r\n");

  await sendCommand(socket, message, [250]);
  await sendCommand(socket, "QUIT", [221]);
  socket.end();

  return true;
}
