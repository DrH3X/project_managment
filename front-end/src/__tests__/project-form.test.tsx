import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock du routeur Next.js.
const mockReplace = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, refresh: mockRefresh }),
  usePathname: () => "/projects/new",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock du toast.
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock de l'API projects.
const mockCreateProject = vi.fn();
vi.mock("@/api/projects", () => ({
  createProject: (...args: unknown[]) => mockCreateProject(...args),
}));

import NewProjectPage from "@/app/(app)/projects/new/page";

function renderPage() {
  return render(<NewProjectPage />);
}

// Les inputs `type="date"` ne réagissent pas toujours à userEvent.type ;
// on utilise fireEvent.change pour définir leur valeur de façon fiable.
function setDateValue(label: RegExp, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
}

describe("Formulaire de création de projet", () => {
  beforeEach(() => {
    mockCreateProject.mockReset();
    mockReplace.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockToast.mockReset();
  });

  it("affiche les champs nom, description, dateDebut, dateFin", () => {
    renderPage();
    expect(screen.getByLabelText(/nom du projet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date de début/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date de fin/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /créer le projet/i }),
    ).toBeInTheDocument();
  });

  it("affiche des erreurs quand on soumet un formulaire vide", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /créer le projet/i }));
    expect(await screen.findByText(/le nom du projet est obligatoire/i)).toBeInTheDocument();
    expect(await screen.findByText(/la date de début est obligatoire/i)).toBeInTheDocument();
    expect(await screen.findByText(/la date de fin est obligatoire/i)).toBeInTheDocument();
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it("affiche une erreur si la date de fin est antérieure à la date de début", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/nom du projet/i), "Projet Test");
    setDateValue(/date de début/i, "2025-06-01");
    setDateValue(/date de fin/i, "2025-05-31");
    await user.click(screen.getByRole("button", { name: /créer le projet/i }));
    // L'erreur de cohérence des dates s'affiche sous le champ dateFin.
    const matches = await screen.findAllByText(/la date de fin doit être postérieure ou égale à la date de début/i);
    expect(matches.length).toBeGreaterThan(0);
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it("appelle createProject avec les valeurs saisies quand le formulaire est valide", async () => {
    mockCreateProject.mockResolvedValueOnce({
      id: "p1",
      nom: "Projet Test",
      description: "Une description",
      dateDebut: "2025-01-01T00:00:00.000Z",
      dateFin: "2025-12-31T00:00:00.000Z",
      statut: "NON_COMMENCE",
      chefProjet: "u1",
      createdAt: "2025-01-01T10:00:00.000Z",
      updatedAt: "2025-01-01T10:00:00.000Z",
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/nom du projet/i), "Projet Test");
    await user.type(screen.getByLabelText(/description/i), "Une description");
    setDateValue(/date de début/i, "2025-01-01");
    setDateValue(/date de fin/i, "2025-12-31");
    await user.click(screen.getByRole("button", { name: /créer le projet/i }));

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledTimes(1);
    });
    expect(mockCreateProject).toHaveBeenCalledWith({
      nom: "Projet Test",
      description: "Une description",
      dateDebut: "2025-01-01",
      dateFin: "2025-12-31",
    });
    // Redirection vers la liste après succès.
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/projects");
    });
  });

  it("affiche l'erreur de nom déjà utilisé sous le champ nom", async () => {
    const apiError = Object.assign(new Error("Ce nom est déjà utilisé."), {
      code: "PROJECT_NAME_TAKEN",
      status: 409,
    });
    mockCreateProject.mockRejectedValueOnce(apiError);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText(/nom du projet/i), "Projet Doublon");
    setDateValue(/date de début/i, "2025-01-01");
    setDateValue(/date de fin/i, "2025-12-31");
    await user.click(screen.getByRole("button", { name: /créer le projet/i }));

    expect(
      await screen.findByText(/ce nom de projet est déjà utilisé/i),
    ).toBeInTheDocument();
  });
});
