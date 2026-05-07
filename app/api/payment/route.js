// app/api/payment/route.js — Razorpay
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return NextResponse.json({ error: "Payment not configured." }, { status: 500 });
  }
  let plan;
  try { const body = await request.json(); plan = body?.plan || "pro"; } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

  const AMOUNTS = { pro: 49900, business: 149900 }; // in paise
  const amount = AMOUNTS[plan] || AMOUNTS.pro;

  try {
    const order = await razorpay.orders.create({
      amount, currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: { plan },
    });
    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) { console.error("[/api/payment]", e); return NextResponse.json({ error: "Payment order creation failed." }, { status: 502 }); }
}
export async function GET() { return NextResponse.json({ error: "Use POST." }, { status: 405 }); }
