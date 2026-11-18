"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/brand";
import {
  Mail,
  KeyRound,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface EmailVerificationProps {
  onVerified: (email: string) => void;
}

// Keep in sync with ALLOWED_EMAIL_DOMAINS on the server.
const ALLOWED_DOMAINS = ["salesforce.com", "iberostar.com", "grupoiberostar.com"];

function isAllowed(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1];
  return ALLOWED_DOMAINS.includes(domain);
}

function allowedDomainsMessage(): string {
  return ALLOWED_DOMAINS.map((d) => `@${d}`).join(" o ");
}

export function EmailVerification({ onVerified }: EmailVerificationProps) {
  const [step, setStep] = useState<"email" | "code" | "verified">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = useCallback(async () => {
    setError("");
    if (!isAllowed(email)) {
      setError(`El acceso está limitado a ${allowedDomainsMessage()}.`);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "No se ha podido enviar el código de verificación");
        return;
      }
      setStep("code");
    } catch {
      setError("No se ha podido enviar el código de verificación. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const handleVerifyCode = useCallback(async () => {
    setError("");
    if (code.length !== 6) {
      setError("Introduce el código de 6 dígitos.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/send-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Código de verificación no válido");
        return;
      }
      setStep("verified");
      setTimeout(() => onVerified(email.toLowerCase()), 1200);
    } catch {
      setError("No se ha podido completar la verificación. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [code, email, onVerified]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 brand-grid-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      <Card className="relative w-full max-w-md border-white/10 bg-card/95 backdrop-blur shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <BrandLogo />
          </div>
          <CardTitle className="text-xl">Portal de demostración: casos de uso de IA agéntica</CardTitle>
          <CardDescription>
            Acceso restringido: solo para empleados autorizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Verifica tu identidad para continuar. Te enviaremos un código de
                  6 dígitos a tu correo corporativo.
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={`tu.nombre@${ALLOWED_DOMAINS[0]}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button
                className="w-full"
                onClick={handleSendCode}
                disabled={!email || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando código…
                  </>
                ) : (
                  <>
                    <Mail className="size-4" />
                    Enviar código de verificación
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>Hemos enviado un código de verificación a</p>
                <p className="font-medium text-foreground">{email}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificación</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="Introduce el código de 6 dígitos"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="pl-10 text-center text-lg tracking-[0.4em]"
                    maxLength={6}
                    onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Verificar y continuar
              </Button>
              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                  }}
                >
                  Cambiar correo
                </button>
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={handleSendCode}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {step === "verified" && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Verificado</h3>
              <p className="text-sm text-muted-foreground">
                Te damos la bienvenida. Abriendo el portal…
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
