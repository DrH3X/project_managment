"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types";
import { Loader2 } from "lucide-react";

/**
 * Garde de page côté client.
 * - Si l'utilisateur n'est pas authentifié, redirige vers /login.
 * - Si un rôle est requis et que l'utilisateur n'en dispose pas,
 *   redirige vers /forbidden.
 * - Pendant le chargement initial de la session, affiche un indicateur.
 *
 * Le jeton étant stocké dans localStorage, le middleware Next.js ne peut
 * pas le lire : la protection se fait donc côté client.
 */
export function AuthGuard({
  roles,
  children,
}: {
  /** Rôles autorisés à voir la page. Si omis, tout utilisateur connecté peut voir. */
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      router.replace("/forbidden");
    }
  }, [user, loading, roles, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
          <p className="text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  // L'utilisateur est connecté mais n'a pas le rôle requis : on n'affiche
  // rien pendant que la redirection vers /forbidden se fait.
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
          <p className="text-sm">Accès refusé…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
