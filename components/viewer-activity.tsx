"use client";

import { useEffect, useState } from "react";
import { usePortal, isAdminEmail } from "@/components/portal-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Users } from "lucide-react";

interface UserSummary {
  email: string;
  count: number;
  lastAt: string;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  return `hace ${day} d`;
}

function UserList({
  users,
  label,
  pluralLabel,
  emptyText,
}: {
  users: UserSummary[] | null;
  label: string;
  pluralLabel: string;
  emptyText: string;
}) {
  if (users === null) {
    return <p className="py-4 text-sm text-muted-foreground">Cargando…</p>;
  }
  if (users.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="max-h-80 divide-y divide-border overflow-y-auto">
      {users.map((u) => (
        <li
          key={u.email}
          className="flex items-center justify-between gap-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold uppercase text-muted-foreground">
              {u.email.slice(0, 2)}
            </span>
            <span className="truncate text-sm">{u.email}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {u.count} {u.count === 1 ? label : pluralLabel} ·{" "}
            {relativeTime(u.lastAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Per use case: an icon button (admin-only) that opens a dialog listing the
 * tracked-domain users who viewed this use case.
 */
export function ViewerActivityButton({ slug }: { slug: string }) {
  const { verifiedEmail } = usePortal();
  const [open, setOpen] = useState(false);
  const [viewers, setViewers] = useState<UserSummary[] | null>(null);

  useEffect(() => {
    if (!open || !isAdminEmail(verifiedEmail)) return;
    setViewers(null);
    fetch(
      `/api/activity?viewer=${encodeURIComponent(verifiedEmail)}&slug=${encodeURIComponent(slug)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setViewers(d?.viewers || []))
      .catch(() => setViewers([]));
  }, [open, slug, verifiedEmail]);

  if (!isAdminEmail(verifiedEmail)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Visitantes del caso de uso"
          title="Visitantes del caso de uso"
        >
          <Users className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Visitantes del caso de uso
          </DialogTitle>
          <DialogDescription>
            Personas que han abierto este caso de uso.
          </DialogDescription>
        </DialogHeader>
        <UserList
          users={viewers}
          label="visualización"
          pluralLabel="visualizaciones"
          emptyText="Todavía nadie ha visto este caso de uso."
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Header control: an icon button (admin-only) that opens a dialog listing the
 * users who have signed into the portal.
 */
export function PortalActivityButton() {
  const { verifiedEmail } = usePortal();
  const [open, setOpen] = useState(false);
  const [logins, setLogins] = useState<UserSummary[] | null>(null);

  useEffect(() => {
    if (!open || !isAdminEmail(verifiedEmail)) return;
    setLogins(null);
    fetch(`/api/activity?viewer=${encodeURIComponent(verifiedEmail)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLogins(d?.logins || []))
      .catch(() => setLogins([]));
  }, [open, verifiedEmail]);

  if (!isAdminEmail(verifiedEmail)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Inicios de sesión en el portal"
          title="Inicios de sesión en el portal"
        >
          <Users className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            Inicios de sesión en el portal
          </DialogTitle>
          <DialogDescription>
            Todas las personas que han iniciado sesión en el portal.
          </DialogDescription>
        </DialogHeader>
        <UserList
          users={logins}
          label="inicio de sesión"
          pluralLabel="inicios de sesión"
          emptyText="Todavía no hay inicios de sesión registrados."
        />
      </DialogContent>
    </Dialog>
  );
}
