"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getUser, updateUser } from "@/api/users";
import type { ApiError, Role, User } from "@/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";

// En modification, le mot de passe est facultatif (au moins un champ requis).
const editSchema = z
  .object({
    nom: z.string().min(1, "Le nom est obligatoire."),
    prenom: z.string().min(1, "Le prénom est obligatoire."),
    email: z
      .string()
      .min(1, "L'email est obligatoire.")
      .email("L'email n'est pas valide."),
    motDePasse: z
      .string()
      .optional()
      .refine((v) => !v || v.length >= 6, {
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      }),
    role: z.enum(["ADMIN", "CHEF_PROJET", "EMPLOYE"]),
  })
  .refine((data) => {
    // Au moins un champ modifié : le mot de passe est le seul vraiment optionnel,
    // les autres sont pré-remplis, donc on envoie toujours au moins nom/prenom/email/role.
    return (
      data.nom ||
      data.prenom ||
      data.email ||
      data.role ||
      (data.motDePasse && data.motDePasse.length > 0)
    );
  });

type EditFormData = z.infer<typeof editSchema>;

export default function EditUserPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <EditUserForm />
    </AuthGuard>
  );
}

function EditUserForm() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [user, setUser] = useState<User | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const role = useWatch({ control, name: "role" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const u = await getUser(id);
        if (cancelled) return;
        setUser(u);
        reset({
          nom: u.nom,
          prenom: u.prenom,
          email: u.email,
          motDePasse: "",
          role: u.role,
        });
      } catch (err) {
        setLoadError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, reset]);

  async function onSubmit(values: EditFormData) {
    setSubmitting(true);
    setServerErrors({});
    try {
      // N'envoie le mot de passe que s'il est renseigné.
      const payload: Record<string, unknown> = {
        nom: values.nom,
        prenom: values.prenom,
        email: values.email,
        role: values.role,
      };
      if (values.motDePasse && values.motDePasse.length > 0) {
        payload.motDePasse = values.motDePasse;
      }
      const updated = await updateUser(id, payload);
      toast({
        title: "Utilisateur modifié",
        description: `${updated.prenom} ${updated.nom} a été mis à jour.`,
      });
      router.push("/users");
      router.refresh();
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "EMAIL_TAKEN") {
        setServerErrors({ email: "Cet email est déjà utilisé par un autre utilisateur." });
      } else if (e.code === "USER_NOT_FOUND") {
        toast({
          title: "Utilisateur introuvable",
          description: "Cet utilisateur n'existe plus.",
          variant: "destructive",
        });
        router.push("/users");
      } else if (e.code === "VALIDATION_ERROR") {
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
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link href="/users">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Retour à la liste
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          Modifier l'utilisateur
        </h1>
        <p className="text-sm text-muted-foreground">
          Mettez à jour les informations du compte.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="grid gap-4 py-6 sm:grid-cols-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={() => router.refresh()} />
      ) : user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {user.prenom} {user.nom}
            </CardTitle>
            <CardDescription>
              Modifiez les champs souhaités. Le mot de passe n'est obligatoire
              que si vous souhaitez le changer.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <Input
                  id="prenom"
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
                <Label htmlFor="motDePasse">
                  Nouveau mot de passe{" "}
                  <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  id="motDePasse"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Laisser vide pour conserver l'actuel"
                  aria-invalid={
                    !!errors.motDePasse || !!serverErrors.motDePasse
                  }
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
                  onValueChange={(v) =>
                    setValue("role", v as Role, { shouldValidate: true })
                  }
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
