import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock du contexte d'authentification : on contrôle isAuthenticated/loading/login.
const mockLogin = vi.fn();
const mockUseAuth = vi.fn();
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock du routeur Next.js.
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(),
}));

import LoginPage from "@/app/login/page";

function renderLogin(overrides: Partial<{
  isAuthenticated: boolean;
  loading: boolean;
  login: typeof mockLogin;
}> = {}) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    loading: false,
    login: mockLogin,
    user: null,
    ...overrides,
  });
  return render(<LoginPage />);
}

describe("Page de connexion", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockReplace.mockReset();
  });

  it("affiche les champs email et mot de passe", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /se connecter/i }),
    ).toBeInTheDocument();
  });

  it("affiche des erreurs de validation quand on soumet un formulaire vide", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: /se connecter/i }));
    expect(await screen.findByText(/l'email est obligatoire/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/le mot de passe est obligatoire/i),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("affiche une erreur pour un email mal formé", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), "pas-un-email");
    await user.type(screen.getByLabelText(/mot de passe/i), "MotDePasse123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));
    expect(await screen.findByText(/l'email n'est pas valide/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("appelle login avec les valeurs saisies quand le formulaire est valide", async () => {
    mockLogin.mockResolvedValueOnce({
      id: "1",
      nom: "Admin",
      prenom: "Système",
      email: "admin@plateforme.local",
      role: "ADMIN",
      createdAt: "2025-01-01T10:00:00.000Z",
      updatedAt: "2025-01-01T10:00:00.000Z",
    });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), "admin@plateforme.local");
    await user.type(screen.getByLabelText(/mot de passe/i), "Admin123!");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
    expect(mockLogin).toHaveBeenCalledWith({
      email: "admin@plateforme.local",
      motDePasse: "Admin123!",
    });
  });

  it("affiche un message d'erreur clair en cas d'identifiants incorrects", async () => {
    const apiError = Object.assign(new Error("Identifiants incorrects."), {
      code: "INVALID_CREDENTIALS",
      status: 401,
    });
    mockLogin.mockRejectedValueOnce(apiError);
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), "admin@plateforme.local");
    await user.type(screen.getByLabelText(/mot de passe/i), "MauvaisMdp");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    expect(
      await screen.findByText(/identifiants incorrects/i),
    ).toBeInTheDocument();
  });

  it("redirige vers l'accueil si déjà authentifié", async () => {
    renderLogin({ isAuthenticated: true, loading: false });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });
});
