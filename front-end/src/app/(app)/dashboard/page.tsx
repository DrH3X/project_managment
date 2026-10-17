"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, UserCheck, FolderKanban, ListChecks } from "lucide-react";

/**
 * Tableau de bord d'accueil par rôle.
 * - ADMIN : raccourcis vers la gestion des utilisateurs et des employés.
 * - CHEF_PROJET : message d'accueil (les projets arrivent au sprint 1).
 * - EMPLOYE : message d'accueil (les tâches arrivent au sprint 2).
 */
export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour, {user.prenom} {user.nom}
        </h1>
        <p className="text-sm text-muted-foreground">
          Vous êtes connecté en tant que {roleLabel(user.role).toLowerCase()}.
        </p>
      </div>

      {user.role === "ADMIN" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">Utilisateurs</CardTitle>
                  <CardDescription className="text-xs">
                    Gérer les comptes et les rôles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href="/users"
                className="text-sm font-medium text-primary hover:underline"
              >
                Accéder à la gestion des utilisateurs →
              </Link>
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                  <UserCheck className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">Employés</CardTitle>
                  <CardDescription className="text-xs">
                    Lister les employés de l'entreprise
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link
                href="/employees"
                className="text-sm font-medium text-primary hover:underline"
              >
                Accéder à la liste des employés →
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {user.role === "CHEF_PROJET" ? (
              <>
                <FolderKanban className="h-5 w-5 text-amber-600" aria-hidden="true" />
                Gestion des projets
              </>
            ) : (
              <>
                <ListChecks className="h-5 w-5 text-sky-600" aria-hidden="true" />
                Mes tâches
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user.role === "CHEF_PROJET"
              ? "La création et le suivi de vos projets seront disponibles dès le prochain sprint."
              : "La consultation de vos tâches affectées sera disponible dès le prochain sprint."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
