import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface BrokerRequestBody {
  brokerUrl: string;
  text: string;
  apiInstanceId?: string;
  contextId?: string;
}

// Extract human-readable text from an A2A task response.
function extractText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, unknown>;

  // result wrapper (JSON-RPC) or direct task
  const task = (obj.result as Record<string, unknown>) || obj;

  const collect = (parts: unknown): string => {
    if (!Array.isArray(parts)) return "";
    return parts
      .map((p) => {
        const part = p as Record<string, unknown>;
        if (part?.kind === "text" && typeof part.text === "string") {
          return part.text;
        }
        if (typeof part?.text === "string") return part.text as string;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  };

  const artifacts = task.artifacts as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(artifacts) && artifacts.length) {
    const text = artifacts.map((a) => collect(a.parts)).filter(Boolean).join("\n\n");
    if (text) return text;
  }

  // status.message.parts fallback
  const status = task.status as Record<string, unknown> | undefined;
  const message = status?.message as Record<string, unknown> | undefined;
  if (message?.parts) {
    const text = collect(message.parts);
    if (text) return text;
  }

  return "";
}

// One log line per event, tagged with a per-call id so the request and its
// response can be matched in `heroku logs`.
function log(id: string, event: string, data: Record<string, unknown>) {
  console.log(`[broker] ${id} ${event} ${JSON.stringify(data)}`);
}

export async function POST(req: NextRequest) {
  const logId = randomUUID().slice(0, 8);
  const startedAt = Date.now();

  // Every response returned to the web page goes through here so it is logged.
  const respond = (payload: Record<string, unknown>, status = 200) => {
    log(logId, "response", { status, ms: Date.now() - startedAt, body: payload });
    return NextResponse.json(payload, { status });
  };

  const rawBody = await req.text();
  log(logId, "request", { body: rawBody });

  let body: BrokerRequestBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return respond({ error: "Cuerpo de la solicitud no válido" }, 400);
  }

  const { brokerUrl, text, apiInstanceId, contextId } = body;

  if (!brokerUrl || !/^https?:\/\//i.test(brokerUrl)) {
    return respond({ error: "Se necesita una URL de broker válida." }, 400);
  }
  if (!text || !text.trim()) {
    return respond({ error: "El texto del mensaje es obligatorio." }, 400);
  }

  const payload = {
    jsonrpc: "2.0",
    id: Math.floor(Math.random() * 1_000_000_000),
    method: "message/send",
    params: {
      message: {
        role: "user",
        kind: "message",
        parts: [{ kind: "text", text }],
        messageId: randomUUID(),
        ...(contextId ? { contextId } : {}),
      },
      metadata: {},
    },
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiInstanceId && apiInstanceId.trim()) {
    headers["x-anypoint-api-instance-id"] = apiInstanceId.trim();
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);

    log(logId, "broker-request", { url: brokerUrl, headers, payload });
    const res = await fetch(brokerUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const raw = await res.text();
    log(logId, "broker-response", {
      status: res.status,
      ms: Date.now() - startedAt,
      body: raw,
    });
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }

    if (!res.ok) {
      return respond(
        {
          error: `El broker ha respondido con ${res.status} ${res.statusText}`,
          detail: raw?.slice(0, 800),
        },
        502
      );
    }

    const reply = extractText(data) || "(El broker no ha devuelto contenido de texto).";
    const newContextId =
      (data as Record<string, unknown>)?.contextId ||
      ((data as Record<string, unknown>)?.result as Record<string, unknown>)
        ?.contextId ||
      contextId ||
      null;

    return respond({ reply, contextId: newContextId, raw: data });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Se ha agotado el tiempo de espera de la solicitud al broker."
        : "No se ha podido conectar con el broker. Comprueba la URL y la red.";
    log(logId, "broker-error", { error: err instanceof Error ? err.message : String(err) });
    return respond({ error: message }, 502);
  }
}
