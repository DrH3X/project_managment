import { roleLabel } from "@/lib/format";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const ROLE_BADGE_STYLES: Record<Role, string> = {
  ADMIN: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  CHEF_PROJET:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  EMPLOYE:
    "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
};

/** Badge coloré affichant le libellé français d'un rôle. */
export function RoleBadge({
  role,
  className,
}: {
  role: Role;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", ROLE_BADGE_STYLES[role], className)}
    >
      {roleLabel(role)}
    </Badge>
  );
}
