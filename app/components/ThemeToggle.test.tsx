import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "./ThemeToggle";

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();
const mockSun = vi.fn(() => <svg data-testid="sun-icon">Sun</svg>);
const mockMoon = vi.fn(() => <svg data-testid="moon-icon">Moon</svg>);

// next-themes をモック
vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

// lucide-react の Sun と Moon をモック
vi.mock("lucide-react", () => ({
  Sun: () => mockSun(),
  Moon: () => mockMoon(),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSun.mockClear();
    mockMoon.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("themeがdarkの時はSunアイコンが表示される", async () => {
    mockUseTheme.mockReturnValue({
      theme: "dark",
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("moon-icon")).not.toBeInTheDocument();
    });

    // マウント後のSunアイコンが表示されていることを確認
    // (マウント前にもSunが表示されるが、マウント後もSunが表示される)
    expect(mockSun).toHaveBeenCalled();
  });

  it("themeがlightの時はMoonアイコンが表示される", async () => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
    });

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("sun-icon")).not.toBeInTheDocument();
    });

    // マウント後はMoonアイコンが表示されることを確認
    // (マウント前にはSunが表示されるが、マウント後はMoonに切り替わる)
    expect(mockMoon).toHaveBeenCalled();
  });
});
