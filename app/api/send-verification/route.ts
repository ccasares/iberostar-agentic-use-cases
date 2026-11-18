import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { isAllowedEmail, allowedDomainsLabel } from "@/lib/email-domains";

// In-memory store for verification codes. Fine for a single-instance demo.
const verificationCodes = new Map<string, { code: string; expires: number }>();

const APP_NAME = "Portal de demostración: casos de uso de IA agéntica";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !isAllowedEmail(email)) {
      return NextResponse.json(
        {
          error: `El acceso está restringido. Usa tu dirección de correo de ${allowedDomainsLabel()}.`,
        },
        { status: 400 }
      );
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASSWORD
    ) {
      console.error("SMTP configuration missing");
      return NextResponse.json(
        { error: "El servicio de correo no está configurado. Ponte en contacto con el administrador." },
        { status: 500 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email.toLowerCase(), {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    });

    const port = parseInt(process.env.SMTP_PORT || "587");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // 465 is implicit TLS; 587 and 2525 start plaintext and STARTTLS up.
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || APP_NAME}" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to: email,
      subject: `Tu código de verificación de ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9;">
          <div style="max-width: 480px; margin: 40px auto; background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
            <div style="background: linear-gradient(135deg, #002855 0%, #001833 100%); padding: 28px 32px;">
              <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">${process.env.BRAND_NAME || "Grupo Iberostar"}</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0 0; font-size: 13px;">${APP_NAME}</p>
            </div>
            <div style="padding: 32px;">
              <p style="color: #0f172a; font-size: 16px; margin: 0 0 20px 0;">Tu código de verificación es:</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; text-align: center; margin-bottom: 22px;">
                <span style="font-family: 'SF Mono', Monaco, monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #002855;">${code}</span>
              </div>
              <p style="color: #64748b; font-size: 14px; margin: 0 0 6px 0;">Este código caduca en 10 minutos.</p>
              <p style="color: #64748b; font-size: 14px; margin: 0;">Si no has solicitado este código, puedes ignorar este correo sin problema.</p>
            </div>
            <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #eee;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">${process.env.BRAND_NAME || "Grupo Iberostar"} — Demostración de casos de uso de IA agéntica</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Tu código de verificación de ${APP_NAME} es: ${code}\n\nEste código caduca en 10 minutos.`,
    });

    return NextResponse.json({ success: true, message: "Código de verificación enviado" });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return NextResponse.json(
      { error: "No se ha podido enviar el correo de verificación. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json(
        { error: "El correo y el código son obligatorios" },
        { status: 400 }
      );
    }

    const key = email.toLowerCase();
    const stored = verificationCodes.get(key);

    if (!stored) {
      return NextResponse.json(
        { error: "No se ha encontrado ningún código de verificación. Solicita uno nuevo." },
        { status: 400 }
      );
    }
    if (Date.now() > stored.expires) {
      verificationCodes.delete(key);
      return NextResponse.json(
        { error: "El código de verificación ha caducado. Solicita uno nuevo." },
        { status: 400 }
      );
    }
    if (stored.code !== code) {
      return NextResponse.json(
        { error: "Código de verificación no válido" },
        { status: 400 }
      );
    }

    verificationCodes.delete(key);
    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error("Failed to verify code:", error);
    return NextResponse.json(
      { error: "No se ha podido completar la verificación. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
