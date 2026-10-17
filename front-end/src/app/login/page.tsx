"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Loader2, AlertCircle } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
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
import { ApiError } from "@/types";

// Schéma de validation du formulaire de connexion.
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est obligatoire.")
    .email("L'email n'est pas valide."),
  motDePasse: z.string().min(1, "Le mot de passe est obligatoire."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", motDePasse: "" },
  });

  // Si déjà authentifié, redirige selon le rôle.
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, authLoading, router]);

  async function onSubmit(values: LoginFormData) {
    setSubmitting(true);
    setGlobalError(null);
    try {
      const user = await login(values);
      // Redirection après connexion selon le rôle.
      if (user.role === "ADMIN") {
        router.replace("/users");
      } else {
        router.replace("/dashboard");
      }
    } catch (err) {
      const error = err as ApiError;
      // 401 INVALID_CREDENTIALS → identifiants incorrects.
      // 400 VALIDATION_ERROR → erreur de validation serveur.
      // Autres → message du serveur.
      if (error.code === "INVALID_CREDENTIALS") {
        setGlobalError(
          "Identifiants incorrects. Vérifiez votre email et votre mot de passe.",
        );
      } else if (error.message) {
        setGlobalError(error.message);
      } else {
        setGlobalError("Impossible de se connecter. Réessayez.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Accédez à la plateforme de gestion de projets et de tâches.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {globalError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{globalError}</span>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="vous@entreprise.local"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email ? (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="motDePasse">Mot de passe</Label>
              <Input
                id="motDePasse"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.motDePasse}
                aria-describedby={
                  errors.motDePasse ? "motDePasse-error" : undefined
                }
                {...register("motDePasse")}
              />
              {errors.motDePasse ? (
                <p id="motDePasse-error" className="text-sm text-destructive">
                  {errors.motDePasse.message}
                </p>
              ) : null}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || authLoading}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Connexion…
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Plateforme de gestion de projets et tâches
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
