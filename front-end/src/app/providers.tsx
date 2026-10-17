"use client";

import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

/**
 * Fournisseurs côté client de l'application.
 * Regroupe le contexte d'authentification et les notifications (toaster).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
