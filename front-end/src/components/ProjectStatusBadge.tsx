import { projectStatusLabel } from "@/lib/format";
import type { ProjectStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_STYLES: Record<ProjectStatus, string> = {
  NON_COMMENCE:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700",
  EN_COURS:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  TERMINE:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
};

/** Badge coloré affichant le libellé français d'un statut de projet. */
export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_BADGE_STYLES[status], className)}
    >
      {projectStatusLabel(status)}
    </Badge>
  );
}
