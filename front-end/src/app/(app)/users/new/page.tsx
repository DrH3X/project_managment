"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUser } from "@/api/users";
import type { ApiError, Role } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage, getFieldErrors } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

const createSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire."),
  prenom: z.string().min(1, "Le prénom est obligatoire."),
  email: z
    .string()
    .min(1, "L'email est obligatoire.")
    .email("L'email n'est pas valide."),
  motDePasse: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  role: z.enum(["ADMIN", "CHEF_PROJET", "EMPLOYE"]),
});

type CreateFormData = z.infer<typeof createSchema>;

export default function NewUserPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <NewUserForm />
    </AuthGuard>
  );
}

function NewUserForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      motDePasse: "",
      role: "EMPLOYE",
    },
  });

  const role = useWatch({ control, name: "role" });

  async function onSubmit(values: CreateFormData) {
    setSubmitting(true);
    setServerErrors({});
    try {
      const created = await createUser(values);
      toast({
        title: "Utilisateur créé",
        description: `${created.prenom} ${created.nom} a été ajouté.`,
      });
      router.push("/users");
      router.refresh();
    } catch (err) {
      const e = err as ApiError;
      // EMAIL_TAKEN → erreur sous le champ email.
      if (e.code === "EMAIL_TAKEN") {
        setServerErrors({ email: "Cet email est déjà utilisé." });
      } else if (e.code === "VALIDATION_ERROR") {
        // Erreurs de validation serveur, par champ si disponibles.
        const fieldErrs = getFieldErrors(e);
        setServerErrors(fieldErrs);
        if (Object.keys(fieldErrs).length === 0) {
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Créer un utilisateur
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez un nouveau compte et attribuez-lui un rôle.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du compte</CardTitle>
          <CardDescription>
            Tous les champs sont obligatoires.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                placeholder="Paul"
                aria-invalid={!!errors.prenom || !!serverErrors.prenom}
                {...register("prenom")}
              />
              {errors.prenom || serverErrors.prenom ? (
                <p className="text-sm text-destructive">
                  {serverErrors.prenom ?? errors.prenom?.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                placeholder="Martin"
                aria-invalid={!!errors.nom || !!serverErrors.nom}
                {...register("nom")}
              />
              {errors.nom || serverErrors.nom ? (
                <p className="text-sm text-destructive">
                  {serverErrors.nom ?? errors.nom?.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="paul@entreprise.local"
                aria-invalid={!!errors.email || !!serverErrors.email}
                {...register("email")}
              />
              {errors.email || serverErrors.email ? (
                <p className="text-sm text-destructive">
                  {serverErrors.email ?? errors.email?.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <Input
                id="motDePasse"
                type="password"
                autoComplete="new-password"
                placeholder="Au moins 6 caractères"
                aria-invalid={!!errors.motDePasse || !!serverErrors.motDePasse}
                {...register("motDePasse")}
              />
              {errors.motDePasse || serverErrors.motDePasse ? (
                <p className="text-sm text-destructive">
                  {serverErrors.motDePasse ?? errors.motDePasse?.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={role}
                onValueChange={(v) => setValue("role", v as Role, { shouldValidate: true })}
              >
                <SelectTrigger id="role" aria-label="Rôle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                  <SelectItem value="CHEF_PROJET">Chef de projet</SelectItem>
                  <SelectItem value="EMPLOYE">Employé</SelectItem>
                </SelectContent>
              </Select>
              {errors.role ? (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/users")}
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
                  Créer l'utilisateur
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
