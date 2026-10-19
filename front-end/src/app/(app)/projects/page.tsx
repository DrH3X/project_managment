"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProjects, deleteProject } from "@/api/projects";
import type { ApiError, Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/format";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProjectStatusBadge } from "@/components/ProjectStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Plus, Pencil, Trash2, FolderKanban, Eye } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canCreate = user?.role === "CHEF_PROJET";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteProject(toDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== toDelete.id));
      toast({
        title: "Projet supprimé",
        description: `Le projet « ${toDelete.nom} » a été supprimé.`,
      });
      setToDelete(null);
    } catch (err) {
      const e = err as ApiError;
      toast({
        title: "Suppression impossible",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projets</h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === "ADMIN"
              ? "Consultez tous les projets de l'entreprise."
              : user?.role === "CHEF_PROJET"
                ? "Gérez vos projets : création, modification, suppression."
                : "Consultez les projets auxquels vous participez."}
          </p>
        </div>
        {canCreate ? (
          <Button onClick={() => router.push("/projects/new")}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Créer un projet
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste des projets</CardTitle>
          <CardDescription>
            {loading
              ? "Chargement…"
              : `${projects.length} projet${projects.length > 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={load} />
          ) : projects.length === 0 ? (
            <EmptyState
              title="Aucun projet"
              message={
                user?.role === "CHEF_PROJET"
                  ? "Vous n'avez pas encore créé de projet."
                  : user?.role === "EMPLOYE"
                    ? "Vous ne participez à aucun projet pour le moment."
                    : "Aucun projet n'a été créé pour le moment."
              }
              icon={<FolderKanban className="h-6 w-6" aria-hidden="true" />}
              action={
                canCreate ? (
                  <Button onClick={() => router.push("/projects/new")} size="sm">
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Créer un projet
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Date de début
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Date de fin
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => {
                    const isOwner = user?.id === p.chefProjet;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/projects/${p.id}`}
                            className="text-primary hover:underline"
                          >
                            {p.nom}
                          </Link>
                          {p.description ? (
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                              {p.description}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {formatDate(p.dateDebut)}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {formatDate(p.dateFin)}
                        </TableCell>
                        <TableCell>
                          <ProjectStatusBadge status={p.statut} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              aria-label={`Voir le projet ${p.nom}`}
                            >
                              <Link href={`/projects/${p.id}`}>
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              </Link>
                            </Button>
                            {isOwner ? (
                              <>
                                <Button
                                  asChild
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Modifier le projet ${p.nom}`}
                                >
                                  <Link href={`/projects/${p.id}/edit`}>
                                    <Pencil
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Supprimer le projet ${p.nom}`}
                                  onClick={() => setToDelete(p)}
                                >
                                  <Trash2
                                    className="h-4 w-4 text-destructive"
                                    aria-hidden="true"
                                  />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet{" "}
              <strong>« {toDelete?.nom} »</strong> ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
