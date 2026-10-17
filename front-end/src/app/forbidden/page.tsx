"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Page 403 — accès refusé (rôle insuffisant). */
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">403</h1>
          <p className="text-lg font-medium text-foreground">
            Accès refusé
          </p>
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas les droits nécessaires pour consulter cette page.
            Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
