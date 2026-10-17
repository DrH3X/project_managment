import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthGuard } from "@/components/AuthGuard";

// Mock du contexte d'authentification : on contrôle user/loading.
const mockUseAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock du routeur Next.js.
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const adminUser = {
  id: "u1",
  nom: "Système",
  prenom: "Admin",
  email: "admin@plateforme.local",
  role: "ADMIN" as const,
  createdAt: "2025-01-01T10:00:00.000Z",
  updatedAt: "2025-01-01T10:00:00.000Z",
};

const employeUser = { ...adminUser, id: "u2", role: "EMPLOYE" as const };

function renderGuard(
  props: React.ComponentProps<typeof AuthGuard>,
) {
  return render(<AuthGuard {...props} />);
}

describe("AuthGuard — garde des pages protégées", () => {
  beforeEach(() => {
    mockReplace.mockReset();
  });

  it("affiche un indicateur de chargement tant que la session se charge", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderGuard({ children: <p>Contenu protégé</p> });
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    expect(screen.queryByText(/contenu protégé/i)).not.toBeInTheDocument();
  });

  it("redirige vers /login quand l'utilisateur n'est pas authentifié", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    renderGuard({ children: <p>Contenu protégé</p> });
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText(/contenu protégé/i)).not.toBeInTheDocument();
  });

  it("affiche le contenu quand l'utilisateur est authentifié (sans restriction de rôle)", () => {
    mockUseAuth.mockReturnValue({ user: adminUser, loading: false });
    renderGuard({ children: <p>Contenu protégé</p> });
    expect(screen.getByText(/contenu protégé/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("affiche le contenu quand le rôle de l'utilisateur est autorisé", () => {
    mockUseAuth.mockReturnValue({ user: adminUser, loading: false });
    renderGuard({ roles: ["ADMIN"], children: <p>Zone admin</p> });
    expect(screen.getByText(/zone admin/i)).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirige vers /forbidden quand le rôle de l'utilisateur est insuffisant", () => {
    mockUseAuth.mockReturnValue({ user: employeUser, loading: false });
    renderGuard({ roles: ["ADMIN"], children: <p>Zone admin</p> });
    expect(mockReplace).toHaveBeenCalledWith("/forbidden");
    expect(screen.queryByText(/zone admin/i)).not.toBeInTheDocument();
  });
});
