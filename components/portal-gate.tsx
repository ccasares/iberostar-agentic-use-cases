"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { EmailVerification } from "@/components/email-verification";

interface PortalContextValue {
  verifiedEmail: string;
  signOut: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalGate");
  return ctx;
}

// Domain whose users act as portal admins (can see engagement/login activity).
// Keep in sync with ADMIN_EMAIL_DOMAIN on the server.
export const ADMIN_DOMAIN =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN?.trim().toLowerCase() ||
  "iberostar.com";

export function isAdminEmail(email: string): boolean {
  const domain = (email || "").trim().toLowerCase().split("@")[1];
  return domain === ADMIN_DOMAIN;
}

const STORAGE_KEY = "portal_verified_email";
const STORAGE_AT = "portal_verified_at";
const LOGIN_LOGGED_KEY = "portal_login_logged";
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function PortalGate({
  children,
  allowedDomains,
}: {
  children: React.ReactNode;
  allowedDomains: string[];
}) {
  const [ready, setReady] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {
    try {
      const email = localStorage.getItem(STORAGE_KEY);
      const at = localStorage.getItem(STORAGE_AT);
      if (email && at && Date.now() - new Date(at).getTime() < MAX_AGE_MS) {
        setVerifiedEmail(email);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const handleVerified = useCallback((email: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, email);
      localStorage.setItem(STORAGE_AT, new Date().toISOString());
    } catch {
      // ignore
    }
    setVerifiedEmail(email);
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_AT);
      sessionStorage.removeItem(LOGIN_LOGGED_KEY);
    } catch {
      // ignore
    }
    setVerifiedEmail("");
  }, []);

  // Record a portal login once per browser session, so admins can see who
  // signed in. Best-effort; failures are ignored.
  useEffect(() => {
    if (!verifiedEmail) return;
    try {
      if (sessionStorage.getItem(LOGIN_LOGGED_KEY) === verifiedEmail) return;
      sessionStorage.setItem(LOGIN_LOGGED_KEY, verifiedEmail);
    } catch {
      // ignore
    }
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email: verifiedEmail }),
    }).catch(() => {});
  }, [verifiedEmail]);

  if (!ready) {
    return <div className="min-h-screen brand-grid-bg" />;
  }

  if (!verifiedEmail) {
    return <EmailVerification onVerified={handleVerified} allowedDomains={allowedDomains} />;
  }

  return (
    <PortalContext.Provider value={{ verifiedEmail, signOut }}>
      {children}
    </PortalContext.Provider>
  );
}
