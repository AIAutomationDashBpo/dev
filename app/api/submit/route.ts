import { NextResponse } from "next/server";

function isProbablyE164(phone: string) {
  return /^\+?[1-9]\d{7,14}$/.test(phone.trim());
}

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return NextResponse.json(
      { error: "Server not configured (missing N8N webhook settings)." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Minimal guardrails here. n8n should still validate properly.
  const phone = String(body?.phone ?? "").trim();
  const model = String(body?.model_number ?? body?.model ?? "").trim();
  const serial = String(body?.serial_number ?? body?.serial ?? "").trim();

  if (!phone || !model || !serial) {
    return NextResponse.json(
      { error: "Missing phone, model number, or serial number." },
      { status: 400 }
    );
  }
  if (!isProbablyE164(phone)) {
    return NextResponse.json(
      { error: "Phone number format looks invalid." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-recall-secret": secret,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.error || "Workflow failed." },
        { status: upstream.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: data?.message || "Submission received.",
        account_id: data?.account_id,
        submission_id: data?.submission_id,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach workflow service." },
      { status: 502 }
    );
  }
}
