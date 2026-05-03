import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, limit } from "firebase/firestore";

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const IDEAS_COLLECTION = "ideas";
const ACTIVITIES_COLLECTION = "activities";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  const razorpay = new Razorpay({
    key_id: process.env.VITE_RAZORPAY_KEY_ID || "test",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
  });

  app.post("/api/create-order", async (req, res) => {
    const { ideaId } = req.body;
    try {
      const ideaDoc = await getDoc(doc(db, "ideas", ideaId));
      
      if (!ideaDoc.exists()) {
        return res.status(404).json({ error: "Idea not found" });
      }

      const idea: any = ideaDoc.data();
      const options = {
        amount: Math.round(idea.price * 100), // in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Razorpay error:", error);
      res.status(500).json({ error: "Razorpay order creation failed" });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    const { orderId, paymentId, signature, ideaId, userId } = req.body;
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "test");
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === signature) {
      try {
        // Record payment in firestore
        await setDoc(doc(db, "payments", paymentId), {
          id: paymentId,
          orderId,
          ideaId,
          userId,
          createdAt: new Date().toISOString()
        });
        
        // Mark idea as private immediately
        const ideaRef = doc(db, IDEAS_COLLECTION, ideaId);
        await updateDoc(ideaRef, { status: 'private', acquiredBy: userId });

        // Log activity
        const activityRef = doc(collection(db, ACTIVITIES_COLLECTION));
        await setDoc(activityRef, {
          id: activityRef.id,
          type: "purchase",
          text: `💰 Concept Acquired: Someone just went exclusive with a ${ideaId} idea!`,
          timestamp: new Date().toISOString()
        });
        
        res.json({ success: true });
      } catch (err) {
        console.error("Payment recording failed:", err);
        res.status(500).json({ success: false });
      }
    } else {
      res.status(400).json({ success: false, message: "Signature mismatch" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
