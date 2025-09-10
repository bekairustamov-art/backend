import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getServiceAccountObject() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) return JSON.parse(inlineJson);

  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Json) {
    const decoded = Buffer.from(base64Json, "base64").toString("utf8");
    return JSON.parse(decoded);
  }

  const pathCandidates = [];
  const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (envPath) {
    if (path.isAbsolute(envPath)) {
      pathCandidates.push(envPath);
    } else {
      pathCandidates.push(path.resolve(process.cwd(), envPath));
      pathCandidates.push(path.resolve(__dirname, envPath));
      pathCandidates.push(path.resolve(__dirname, "../../", envPath));
    }
  }

  const gac = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gac) {
    pathCandidates.push(path.isAbsolute(gac) ? gac : path.resolve(process.cwd(), gac));
  }

  // Repo default as last fallback
  pathCandidates.push(path.resolve(__dirname, "../../ecommerse-82e8e-280634db4e0d.json"));

  for (const p of pathCandidates) {
    try {
      if (p && fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf8");
        return JSON.parse(raw);
      }
    } catch {}
  }
  throw new Error("Service account JSON not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH.");
}

export function initFirebaseAdmin() {
  if (getApps().length > 0) return;
  const serviceAccount = getServiceAccountObject();
  initializeApp({ credential: cert(serviceAccount) });
}

// Subscribe a single registration token to a topic (no database storage)
export async function subscribeTokenToTopic(token, topic = "all") {
  if (!token) throw new Error("missing token");
  try {
    initFirebaseAdmin();
    await getMessaging().subscribeToTopic([token], topic);
    return true;
  } catch (err) {
    console.error("subscribeToTopic error:", err);
    throw err;
  }
}

// Broadcast to a topic so every subscribed device receives it
export async function sendPushToTopic({ title, body, data, image, topic = "all" }) {
  try {
    initFirebaseAdmin();
    const message = {
      topic,
      notification: {
        title: title || "",
        body: body || "",
        ...(image ? { imageUrl: image } : {}),
      },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
    };
    await getMessaging().send(message);
    return { success: true };
  } catch (err) {
    console.error("FCM v1 send error:", err);
    return { success: false, error: err?.message };
  }
}


