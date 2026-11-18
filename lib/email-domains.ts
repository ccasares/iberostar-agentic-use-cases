export const ALLOWED_DOMAINS = (
  process.env.ALLOWED_EMAIL_DOMAINS || "iberostar.com,grupoiberostar.com"
)
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

export function isAllowedEmail(email: string): boolean {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized.includes("@")) return false;
  const domain = normalized.split("@")[1];
  return ALLOWED_DOMAINS.includes(domain);
}

export function allowedDomainsLabel(): string {
  return ALLOWED_DOMAINS.map((d) => `@${d}`).join(" o ");
}

// Domain whose users act as portal admins: they can see engagement/login
// activity (who from the tracked domain viewed which use case).
export const ADMIN_DOMAIN = (
  process.env.ADMIN_EMAIL_DOMAIN || "iberostar.com"
)
  .trim()
  .toLowerCase();

export function emailDomain(email: string): string {
  return (email || "").trim().toLowerCase().split("@")[1] || "";
}

export function isAdminEmail(email: string): boolean {
  return emailDomain(email) === ADMIN_DOMAIN;
}

// The single user allowed to configure brokers (applied globally per use case).
export const BROKER_CONFIG_ADMIN_EMAIL = (
  process.env.BROKER_CONFIG_ADMIN_EMAIL || "admin@iberostar.com"
)
  .trim()
  .toLowerCase();

export function isBrokerConfigAdmin(email: string): boolean {
  return (email || "").trim().toLowerCase() === BROKER_CONFIG_ADMIN_EMAIL;
}
