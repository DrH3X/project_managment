"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProject, deleteProject } from "@/api/projects";
import type { ApiError, Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/lib/format";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectStatusBadge } from "@/components/ProjectStatusBadge";
import { ErrorState } from "@/components/ErrorState";
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
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  User as UserIcon,
  FileText,
  Clock,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getProject(id);
      setProject(p);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = !!(user && project && user.id === project.chefProjet);

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      toast({
        title: "Projet supprimé",
        description: `Le projet « ${project.nom} » a été supprimé.`,
      });
      router.push("/projects");
    } catch (err) {
      const e = err as ApiError;
      toast({
        title: "Suppression impossible",
        description: e.message,
        variant: "destructive",
      });
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour aux projets
          </Link>
        </Button>
        <ErrorState error={error} onRetry={load} />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour aux projets
          </Link>
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{project.nom}</h1>
            <ProjectStatusBadge status={project.statut} />
          </div>
          {isOwner ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/projects/${project.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                  Modifier
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive/5"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Supprimer
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du projet</CardTitle>
          <CardDescription>
            Détails du projet{isOwner ? " — vous en êtes le propriétaire" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Description
              </dt>
              <dd className="text-sm text-foreground">
                {project.description ? (
                  project.description
                ) : (
                  <span className="text-muted-foreground italic">
                    Aucune description
                  </span>
                )}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Date de début
              </dt>
              <dd className="text-sm text-foreground">
                {formatDate(project.dateDebut)}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Date de fin
              </dt>
              <dd className="text-sm text-foreground">
                {formatDate(project.dateFin)}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Chef de projet
              </dt>
              <dd className="text-sm text-foreground">
                {isOwner ? (
                  <span className="font-medium">Vous</span>
                ) : (
                  <span className="text-muted-foreground">
                    Chef de projet
                  </span>
                )}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Créé le
              </dt>
              <dd className="text-sm text-foreground">
                {formatDateTime(project.createdAt)}
              </dd>
            </div>

            <div className="space-y-1">
              <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Mis à jour le
              </dt>
              <dd className="text-sm text-foreground">
                {formatDateTime(project.updatedAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet{" "}
              <strong>« {project.nom} »</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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
