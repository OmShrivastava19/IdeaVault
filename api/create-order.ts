import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import fs from "fs";
import path from "path";

const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8")
);
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || "test",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
});

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ideaId } = req.body;

  try {
    const ideaDoc = await getDoc(doc(db, "ideas", ideaId));

    if (!ideaDoc.exists()) {
      return res.status(404).json({ error: "Idea not found" });
    }

    const idea: any = ideaDoc.data();
    const options = {
      amount: Math.round(idea.price * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return res.json(order);
  } catch (error) {
    console.error("Razorpay error:", error);
    return res.status(500).json({ error: "Razorpay order creation failed" });
  }
};
