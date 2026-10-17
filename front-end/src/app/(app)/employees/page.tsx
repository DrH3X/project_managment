"use client";

import { useCallback, useEffect, useState } from "react";
import { listEmployees } from "@/api/employees";
import type { User } from "@/types";
import { formatDate } from "@/lib/format";

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
import { RoleBadge } from "@/components/RoleBadge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { UserCheck } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

export default function EmployeesPage() {
  return (
    <AuthGuard roles={["ADMIN"]}>
      <EmployeesContent />
    </AuthGuard>
  );
}

function EmployeesContent() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employés</h1>
        <p className="text-sm text-muted-foreground">
          Liste des utilisateurs de rôle employé. Ils pourront être affectés à
          des tâches lors du prochain sprint.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tous les employés</CardTitle>
          <CardDescription>
            {loading
              ? "Chargement…"
              : `${employees.length} employé${employees.length > 1 ? "s" : ""}`}
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
          ) : employees.length === 0 ? (
            <EmptyState
              title="Aucun employé"
              message="Aucun utilisateur de rôle employé n'a été créé pour le moment."
              icon={<UserCheck className="h-6 w-6" aria-hidden="true" />}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">
                        {e.prenom} {e.nom}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {e.email}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={e.role} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {formatDate(e.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
