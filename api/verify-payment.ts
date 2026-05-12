import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import fs from "fs";
import path from "path";

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8")
);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const IDEAS_COLLECTION = "ideas";
const ACTIVITIES_COLLECTION = "activities";

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, paymentId, signature, ideaId, userId } = req.body;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test");
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === signature) {
    try {
      await setDoc(doc(db, "payments", paymentId), {
        id: paymentId,
        orderId,
        ideaId,
        userId,
        createdAt: new Date().toISOString()
      });
      
      const ideaRef = doc(db, IDEAS_COLLECTION, ideaId);
      await updateDoc(ideaRef, { status: 'private', acquiredBy: userId });

      const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
      await setDoc(activityRef, {
        id: activityRef.id,
        type: "purchase",
        text: `💰 Concept Acquired: Someone just went exclusive with a ${ideaId} idea!`,
        timestamp: new Date().toISOString()
      });
      
      return res.json({ success: true });
    } catch (err) {
      console.error("Payment recording failed:", err);
      return res.status(500).json({ success: false });
    }
  } else {
    return res.status(400).json({ success: false, message: "Signature mismatch" });
  }
};
