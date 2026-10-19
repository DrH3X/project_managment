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
import {
  Users,
  UserCheck,
  FolderKanban,
  ListChecks,
} from "lucide-react";

/**
 * Tableau de bord d'accueil par rôle.
 * - ADMIN : raccourcis vers les projets, les utilisateurs et les employés.
 * - CHEF_PROJET : raccourci vers ses projets.
 * - EMPLOYE : raccourci vers les projets auxquels il participe (mes tâches au sprint 2).
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <FolderKanban className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base">Projets</CardTitle>
                <CardDescription className="text-xs">
                  {user.role === "ADMIN"
                    ? "Consulter tous les projets"
                    : user.role === "CHEF_PROJET"
                      ? "Créer et gérer vos projets"
                      : "Voir les projets auxquels vous participez"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href="/projects"
              className="text-sm font-medium text-primary hover:underline"
            >
              Accéder aux projets →
            </Link>
          </CardContent>
        </Card>

        {user.role === "ADMIN" ? (
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
        ) : null}

        {user.role === "ADMIN" ? (
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
        ) : null}
      </div>

      {user.role === "EMPLOYE" ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="h-5 w-5 text-sky-600" aria-hidden="true" />
              Mes tâches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              La consultation de vos tâches affectées sera disponible dès le
              prochain sprint.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
