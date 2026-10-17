"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listUsers, deleteUser } from "@/api/users";
import type { Role, User } from "@/types";
import { roleLabel } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { RoleBadge } from "@/components/RoleBadge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

type RoleFilter = "ALL" | Role;

export default function UsersPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <UsersContent />
    </AuthGuard>
  );
}

function UsersContent() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (role: RoleFilter) => {
      setLoading(true);
      setError(null);
      try {
        const data = await listUsers(role === "ALL" ? undefined : role);
        setUsers(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(roleFilter);
  }, [roleFilter, load]);

  // Filtre local par texte (nom, prénom, email).
  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.nom.toLowerCase().includes(q) ||
      u.prenom.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteUser(toDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== toDelete.id));
      toast({
        title: "Utilisateur supprimé",
        description: `${toDelete.prenom} ${toDelete.nom} a été supprimé.`,
      });
      setToDelete(null);
    } catch (err) {
      const e = err as ApiError;
      const desc =
        e.code === "CANNOT_DELETE_SELF"
          ? "Vous ne pouvez pas supprimer votre propre compte."
          : e.message;
      toast({
        title: "Suppression impossible",
        description: desc,
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
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les comptes, les rôles et les accès.
          </p>
        </div>
        <Button onClick={() => router.push("/users/new")}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Créer un utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Liste des utilisateurs</CardTitle>
          <CardDescription>
            {loading
              ? "Chargement…"
              : `${filtered.length} utilisateur${filtered.length > 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de filtres */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Rechercher par nom, prénom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                aria-label="Rechercher un utilisateur"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as RoleFilter)}
            >
              <SelectTrigger className="w-full sm:w-56" aria-label="Filtrer par rôle">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="CHEF_PROJET">Chef de projet</SelectItem>
                <SelectItem value="EMPLOYE">Employé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contenu selon l'état */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState error={error} onRetry={() => load(roleFilter)} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Aucun utilisateur"
              message={
                search || roleFilter !== "ALL"
                  ? "Aucun utilisateur ne correspond à votre recherche."
                  : "Aucun utilisateur n'a été créé pour le moment."
              }
              icon={<Users className="h-6 w-6" aria-hidden="true" />}
              action={
                <Button onClick={() => router.push("/users/new")} size="sm">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Créer un utilisateur
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Créé le
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.prenom} {u.nom}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label={`Modifier ${u.prenom} ${u.nom}`}
                          >
                            <Link href={`/users/${u.id}/edit`}>
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Supprimer ${u.prenom} ${u.nom}`}
                            onClick={() => setToDelete(u)}
                            disabled={currentUser?.id === u.id}
                            title={
                              currentUser?.id === u.id
                                ? "Vous ne pouvez pas supprimer votre propre compte"
                                : "Supprimer"
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de confirmation de suppression */}
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
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong>
                {toDelete?.prenom} {toDelete?.nom}
              </strong>{" "}
              ({toDelete?.email}) ? Cette action est irréversible.
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
