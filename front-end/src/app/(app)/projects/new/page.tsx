"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProject } from "@/api/projects";
import type { ApiError } from "@/types";
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
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Schéma de validation du formulaire de création de projet.
// dateFin doit être >= dateDebut (règle métier, vérifiée aussi côté serveur).
const createSchema = z
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

type CreateFormData = z.infer<typeof createSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { nom: "", description: "", dateDebut: "", dateFin: "" },
  });

  // Surveille les dates pour recalculer l'attribut min de dateFin.
  const dateDebut = useWatch({ control, name: "dateDebut" });

  async function onSubmit(values: CreateFormData) {
    setSubmitting(true);
    setServerErrors({});
    try {
      const created = await createProject({
        nom: values.nom,
        description: values.description ?? "",
        dateDebut: values.dateDebut,
        dateFin: values.dateFin,
      });
      toast({
        title: "Projet créé",
        description: `Le projet « ${created.nom} » a été créé.`,
      });
      router.push("/projects");
      router.refresh();
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "PROJECT_NAME_TAKEN") {
        setServerErrors({
          nom: "Ce nom de projet est déjà utilisé.",
        });
      } else if (e.code === "DATE_RANGE_INVALID") {
        setServerErrors({
          dateFin: "La date de fin doit être postérieure ou égale à la date de début.",
        });
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
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour aux projets
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Créer un projet
        </h1>
        <p className="text-sm text-muted-foreground">
          Renseignez les informations du nouveau projet. Le statut initial est
          « Non commencé » et sera calculé automatiquement à partir des tâches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du projet</CardTitle>
          <CardDescription>
            Le nom doit être unique. La date de fin doit être postérieure ou
            égale à la date de début.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du projet</Label>
              <Input
                id="nom"
                placeholder="Projet Alpha"
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
                  aria-invalid={!!errors.dateDebut || !!serverErrors.dateDebut}
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
              onClick={() => router.push("/projects")}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Création…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  Créer le projet
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
