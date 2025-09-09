import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getServiceAccountPath() {
  return process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || path.resolve(__dirname, "../../ecommerse-82e8e-280634db4e0d.json");
}

export function initFirebaseAdmin() {
  if (getApps().length > 0) return;
  const saPath = getServiceAccountPath();
  const raw = fs.readFileSync(saPath, "utf8");
  const serviceAccount = JSON.parse(raw);
  initializeApp({ credential: cert(serviceAccount) });
}

// Subscribe a single registration token to a topic (no database storage)
export async function subscribeTokenToTopic(token, topic = "all") {
  if (!token) throw new Error("missing token");
  initFirebaseAdmin();
  await getMessaging().subscribeToTopic([token], topic);
  return true;
}

// Broadcast to a topic so every subscribed device receives it
export async function sendPushToTopic({ title, body, data, image, topic = "all" }) {
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
  try {
    await getMessaging().send(message);
    return { success: true };
  } catch (err) {
    console.error("FCM v1 send error:", err);
    return { success: false };
  }
}


