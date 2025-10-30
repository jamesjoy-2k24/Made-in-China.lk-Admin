import admin from "firebase-admin";
import { env } from "./env";

function initByInlineJson() {
  const raw = env.SERVICE_ACCOUNT_KEY;
  if (!raw) return false;
  try {
    const svc = JSON.parse(raw);
    svc.private_key = String(svc.private_key || "").replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert(svc as admin.ServiceAccount),
      storageBucket: env.STORAGE_BUCKET || undefined,
    });
    console.log("✅ Firebase Admin initialized (inline JSON)");
    return true;
  } catch (e) {
    console.error("Failed to parse SERVICE_ACCOUNT_KEY:", e);
    return false;
  }
}

function initByDiscreteVars() {
  if (!env.PROJECT_ID || !env.CLIENT_EMAIL || !env.PRIVATE_KEY) return false;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.PROJECT_ID,
      clientEmail: env.CLIENT_EMAIL,
      privateKey: env.PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: env.STORAGE_BUCKET || undefined,
  });
  console.log("✅ Firebase Admin initialized (discrete vars)");
  return true;
}

if (!admin.apps.length) {
  if (!initByInlineJson()) {
    if (!initByDiscreteVars()) {
      throw new Error("Firebase Admin init failed: provide SERVICE_ACCOUNT_KEY or discrete vars");
    }
  }
}

export { admin };
