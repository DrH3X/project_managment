"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getProject, updateProject } from "@/api/projects";
import type { ApiError, Project } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, getFieldErrors } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { Loader2, Save, ArrowLeft } from "lucide-react";

// Schéma de validation du formulaire de modification de projet.
// Les champs sont individuellement optionnels mais Zod valide la cohérence
// des dates quand les deux sont présentes.
const editSchema = z
  .object({
    nom: z.string().min(1, "Le nom du projet est obligatoire."),
    description: z.string().optional(),
    dateDebut: z.string().min(1, "La date de début est obligatoire."),
    dateFin: z.string().min(1, "La date de fin est obligatoire."),
  })
  .refine((data) => new Date(data.dateFin) >= new Date(data.dateDebut), {
    message: "La date de fin doit être postérieure ou égale à la date de début.",
    path: ["dateFin"],
  });

type EditFormData = z.infer<typeof editSchema>;

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const dateDebut = useWatch({ control, name: "dateDebut" });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const p = await getProject(id);
      setProject(p);
      // Convertit les dates ISO en valeur `yyyy-mm-dd` pour l'input date.
      reset({
        nom: p.nom,
        description: p.description,
        dateDebut: p.dateDebut.split("T")[0],
        dateFin: p.dateFin.split("T")[0],
      });
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(values: EditFormData) {
    setSubmitting(true);
    setServerErrors({});
    try {
      const updated = await updateProject(id, {
        nom: values.nom,
        description: values.description ?? "",
        dateDebut: values.dateDebut,
        dateFin: values.dateFin,
      });
      toast({
        title: "Projet modifié",
        description: `Le projet « ${updated.nom} » a été mis à jour.`,
      });
      router.push(`/projects/${id}`);
      router.refresh();
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "PROJECT_NAME_TAKEN") {
        setServerErrors({
          nom: "Ce nom de projet est déjà utilisé par un autre projet.",
        });
      } else if (e.code === "DATE_RANGE_INVALID") {
        setServerErrors({
          dateFin: "La date de fin doit être postérieure ou égale à la date de début.",
        });
      } else if (e.code === "PROJECT_NOT_FOUND") {
        toast({
          title: "Projet introuvable",
          description: "Ce projet n'existe plus.",
          variant: "destructive",
        });
        router.push("/projects");
      } else if (e.code === "VALIDATION_ERROR") {
        const fieldErrors = getFieldErrors(e);
        if (Object.keys(fieldErrors).length > 0) {
          setServerErrors(fieldErrors);
        } else {
          toast({
            title: "Données invalides",
            description: e.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erreur",
          description: getErrorMessage(err),
          variant: "destructive",
        });
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href={loading ? "/projects" : `/projects/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour au projet
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Modifier le projet
        </h1>
        <p className="text-sm text-muted-foreground">
          Mettez à jour les informations du projet. Le statut n'est pas
          modifiable (calculé automatiquement à partir des tâches).
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={load} />
      ) : project ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations du projet</CardTitle>
            <CardDescription>
              Le nom doit rester unique. La date de fin doit être postérieure ou
              égale à la date de début.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom du projet</Label>
                <Input
                  id="nom"
                  aria-invalid={!!errors.nom || !!serverErrors.nom}
                  {...register("nom")}
                />
                {errors.nom || serverErrors.nom ? (
                  <p className="text-sm text-destructive">
                    {serverErrors.nom ?? errors.nom?.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description{" "}
                  <span className="text-muted-foreground">(optionnelle)</span>
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Décrivez l'objectif du projet…"
                  {...register("description")}
                />
                {serverErrors.description ? (
                  <p className="text-sm text-destructive">
                    {serverErrors.description}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    aria-invalid={
                      !!errors.dateDebut || !!serverErrors.dateDebut
                    }
                    {...register("dateDebut")}
                  />
                  {errors.dateDebut || serverErrors.dateDebut ? (
                    <p className="text-sm text-destructive">
                      {serverErrors.dateDebut ?? errors.dateDebut?.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFin">Date de fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    min={dateDebut || undefined}
                    aria-invalid={!!errors.dateFin || !!serverErrors.dateFin}
                    {...register("dateFin")}
                  />
                  {errors.dateFin || serverErrors.dateFin ? (
                    <p className="text-sm text-destructive">
                      {serverErrors.dateFin ?? errors.dateFin?.message}
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/projects/${id}`)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
