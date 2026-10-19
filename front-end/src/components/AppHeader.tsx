"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserCheck,
  FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * En-tête de l'application authentifiée.
 * Affiche le nom de l'application, les informations de l'utilisateur
 * (nom, prénom, rôle) et le bouton de déconnexion.
 * Sur tablette/mobile, intègre le bouton d'ouverture du menu de navigation.
 */
export function AppHeader({ onToggleNav }: { onToggleNav?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <button
        type="button"
        onClick={onToggleNav}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Ouvrir le menu de navigation"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-foreground"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="hidden text-sm sm:inline">Gestion de projets</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight text-foreground">
                {user.prenom} {user.nom}
              </p>
              <p className="text-xs leading-tight text-muted-foreground">
                {roleLabel(user.role)}
              </p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground"
              aria-hidden="true"
            >
              {user.prenom?.[0]?.toUpperCase()}
              {user.nom?.[0]?.toUpperCase()}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Se déconnecter</span>
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

/** Élément de navigation avec icône et libellé. */
function NavItem({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

/**
 * Menu de navigation latéral, adapté au rôle de l'utilisateur.
 * - Tous : Tableau de bord, Projets
 * - ADMIN : + Utilisateurs, Employés
 */
export function AppNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  if (!user) return null;

  const items: Array<{ href: string; label: string; icon: React.ReactNode }> = [
    {
      href: "/dashboard",
      label: "Tableau de bord",
      icon: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
    },
    {
      href: "/projects",
      label: "Projets",
      icon: <FolderKanban className="h-4 w-4" aria-hidden="true" />,
    },
  ];

  if (user.role === "ADMIN") {
    items.push(
      {
        href: "/users",
        label: "Utilisateurs",
        icon: <Users className="h-4 w-4" aria-hidden="true" />,
      },
      {
        href: "/employees",
        label: "Employés",
        icon: <UserCheck className="h-4 w-4" aria-hidden="true" />,
      },
    );
  }

  return (
    <nav className="flex flex-col gap-1" aria-label="Navigation principale">
      {items.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname.startsWith(item.href)}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}

/**
 * En-tête + navigation combinés en version mobile/tablette (menu coulissant).
 * Affiché uniquement en dessous du breakpoint lg.
 */
export function MobileNav({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-background p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label="Fermer le menu"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <AppNav pathname={pathname} onNavigate={onClose} />
      </div>
    </div>
  );
}
