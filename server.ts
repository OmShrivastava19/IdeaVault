import dotenv from "dotenv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where, limit } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.dirname(__filename);
const ENV_FILES = [
  path.join(PROJECT_ROOT, ".env"),
  path.join(PROJECT_ROOT, ".env.local"),
];

const loadedEnvFiles = ENV_FILES.filter((envFile) => {
  if (!fs.existsSync(envFile)) {
    return false;
  }

  dotenv.config({ path: envFile, override: true });
  return true;
});

const OPENROUTER_MODEL = "openrouter/free";

function getOpenRouterApiKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || "";
}

function getOpenRouterConfigHint() {
  return `Set OPENROUTER_API_KEY in ${ENV_FILES.map((envFile) => path.basename(envFile)).join(" or ")} at the project root, then restart the server.`;
}

function isValidAIMessage(message: unknown): message is { role: string; content: string } {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as { role?: unknown; content?: unknown };
  return typeof candidate.role === "string" && typeof candidate.content === "string" && candidate.content.trim().length > 0;
}

const firebaseConfig = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "firebase-applet-config.json"), "utf-8"));
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

  app.post("/api/create-booster-order", async (req, res) => {
    try {
      const options = {
        amount: 299 * 100, // ₹299 in paise
        currency: "INR",
        receipt: `booster_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Razorpay error:", error);
      res.status(500).json({ error: "Booster order creation failed" });
    }
  });

  app.post("/api/ai/completion", async (req, res) => {
    const { messages, response_format } = req.body;
    const apiKey = getOpenRouterApiKey();

    if (!apiKey) {
      const configHint = getOpenRouterConfigHint();
      console.error("OpenRouter API key is missing.", {
        loadedEnvFiles,
        projectRoot: PROJECT_ROOT,
        configHint,
      });
      return res.status(500).json({
        code: "OPENROUTER_API_KEY_MISSING",
        error: "OpenRouter API key is not configured on the server.",
        userMessage: "AI generation is not configured yet. Ask the developer to set OPENROUTER_API_KEY and restart the server.",
        details: configHint,
      });
    }

    if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isValidAIMessage)) {
      return res.status(400).json({
        code: "INVALID_AI_REQUEST",
        error: "Invalid AI request body. Expected a non-empty messages array with role/content strings.",
        userMessage: "The AI request could not be prepared. Please refresh and try again.",
      });
    }

    console.log(`Starting AI completion with model: ${OPENROUTER_MODEL}`);
    try {
      const requestBody: Record<string, unknown> = {
        model: OPENROUTER_MODEL,
        messages,
      };

      if (response_format) {
        requestBody.response_format = response_format;
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://ideavault.ai",
          "X-Title": "IdeaVault",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const textResponse = await response.text();
      console.log(`OpenRouter response status: ${response.status}`);
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        console.error("OpenRouter Non-JSON Response:", textResponse);
        return res.status(502).json({
          code: "OPENROUTER_INVALID_RESPONSE",
          error: "Invalid JSON response from OpenRouter.",
          userMessage: "The AI provider returned an unexpected response. Please try again in a moment.",
          details: textResponse.substring(0, 200)
        });
      }
      
      if (!response.ok) {
        console.error("OpenRouter API Error Response:", data);
        return res.status(response.status).json({
          code: data?.error?.code || data?.code || "OPENROUTER_REQUEST_FAILED",
          error: data?.error?.message || data?.error || "OpenRouter request failed.",
          userMessage: response.status === 401
            ? "The AI provider rejected the configured API key. Update OPENROUTER_API_KEY and restart the server."
            : response.status === 429
              ? "The AI provider rate limit has been reached. Please try again later."
              : "The AI provider could not complete the request. Please try again.",
          providerError: data,
        });
      }

      if (data.error) {
        console.error("OpenRouter Data Error:", data.error);
        return res.status(502).json({
          code: data?.error?.code || "OPENROUTER_DATA_ERROR",
          error: data?.error?.message || "OpenRouter returned an error payload.",
          userMessage: "The AI provider returned an error. Please try again.",
          providerError: data,
        });
      }

      res.json(data);
    } catch (error) {
      console.error("OpenRouter Proxy Error:", error);
      res.status(500).json({
        code: "OPENROUTER_PROXY_ERROR",
        error: "AI generation failed at the server proxy.",
        userMessage: "The AI request could not reach the provider. Please check the server logs and try again.",
      });
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
    const distPath = path.join(PROJECT_ROOT, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Frontend and API are served through the Express proxy on http://localhost:${PORT}`);
    console.log(`Loaded env files: ${loadedEnvFiles.length > 0 ? loadedEnvFiles.join(", ") : "none"}`);
    if (getOpenRouterApiKey()) {
      console.log("OpenRouter API key detected at startup.");
    } else {
      console.warn(`OpenRouter API key missing at startup. ${getOpenRouterConfigHint()}`);
    }
  });
}

startServer();
