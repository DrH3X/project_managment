"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import {
  AppHeader,
  AppNav,
  MobileNav,
} from "@/components/AppHeader";

/**
 * Mise en page des pages authentifiées.
 * - Garde d'authentification (AuthGuard) : tout utilisateur connecté.
 * - En-tête sticky avec nom, rôle et bouton de déconnexion.
 * - Navigation latérale adaptée au rôle (desktop) / menu coulissant (tablette, mobile).
 * - Le pied de page est collé en bas (sticky footer).
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader onToggleNav={() => setNavOpen((v) => !v)} />

        <MobileNav
          open={navOpen}
          onClose={() => setNavOpen(false)}
          pathname={pathname}
        />

        <div className="flex flex-1">
          {/* Navigation latérale (desktop) */}
          <aside className="hidden w-64 shrink-0 border-r border-border bg-background lg:block">
            <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto p-4">
              <AppNav pathname={pathname} />
            </div>
          </aside>

          {/* Contenu principal */}
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>

        <footer className="mt-auto border-t border-border bg-background px-4 py-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
            <p>Plateforme de gestion de projets et tâches</p>
            <p>Sprint 0 — Authentification et utilisateurs</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  );
}
