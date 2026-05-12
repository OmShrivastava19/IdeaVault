import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || "test",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "test",
});

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const options = {
      amount: 299 * 100,
      currency: "INR",
      receipt: `booster_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return res.json(order);
  } catch (error) {
    console.error("Razorpay error:", error);
    return res.status(500).json({ error: "Booster order creation failed" });
  }
};
