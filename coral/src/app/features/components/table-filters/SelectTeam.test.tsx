import { cleanup, screen, waitFor } from "@testing-library/react";
import { waitForElementToBeRemoved } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import SelectTeam from "src/app/features/components/table-filters/SelectTeam";
import { getTeams } from "src/domain/team/team-api";
import { customRender } from "src/services/test-utils/render-with-wrappers";

jest.mock("src/domain/team/team-api");

const mockGetTeams = getTeams as jest.MockedFunction<typeof getTeams>;

const mockedTeamsResponse = [
  {
    teamname: "Ospo",
    teammail: "ospo@aiven.io",
    teamphone: "003157843623",
    contactperson: "Ospo Office",
    tenantId: 101,
    teamId: 1003,
    app: "",
    showDeleteTeam: false,
    tenantName: "default",
    envList: ["ALL"],
  },
  {
    teamname: "DevRel",
    teammail: "devrel@aiven.io",
    teamphone: "003146237478",
    contactperson: "Dev Rel",
    tenantId: 101,
    teamId: 1004,
    app: "",
    showDeleteTeam: false,
    tenantName: "default",
    envList: ["ALL"],
  },
];

const filterLabel = "Filter by team";
describe("SelectTeam.tsx", () => {
  describe("renders default view when no query is set", () => {
    const mockedOnChange = jest.fn();

    beforeAll(async () => {
      mockGetTeams.mockResolvedValue(mockedTeamsResponse);

      customRender(<SelectTeam onChange={mockedOnChange} />, {
        memoryRouter: true,
        queryClient: true,
      });
      await waitForElementToBeRemoved(
        screen.getByTestId("select-team-loading")
      );
    });

    afterAll(cleanup);

    it("shows a select element for Team", () => {
      const select = screen.getByRole("combobox", {
        name: filterLabel,
      });

      expect(select).toBeEnabled();
    });

    it("renders a list of given options for teams plus a option for `All teams`", () => {
      mockedTeamsResponse.forEach((team) => {
        const option = screen.getByRole("option", {
          name: team.teamname,
        });

        expect(option).toBeEnabled();
      });
      expect(screen.getAllByRole("option")).toHaveLength(
        mockedTeamsResponse.length + 1
      );
    });

    it("shows `All teams` as the active option one", () => {
      const option = screen.getByRole("option", {
        selected: true,
      });
      expect(option).toHaveAccessibleName("All teams");
    });
  });

  describe("sets the active team based on a query param", () => {
    const mockedOnChange = jest.fn();

    const optionName = "Ospo";
    const optionId = "1003";

    beforeEach(async () => {
      const routePath = `/topics?team=${optionId}`;

      mockGetTeams.mockResolvedValue(mockedTeamsResponse);

      customRender(<SelectTeam onChange={mockedOnChange} />, {
        memoryRouter: true,
        queryClient: true,
        customRoutePath: routePath,
      });
      await waitForElementToBeRemoved(
        screen.getByTestId("select-team-loading")
      );
    });

    afterEach(() => {
      jest.resetAllMocks();
      cleanup();
    });

    it("shows `Ospo` as the active option one", async () => {
      const option = await screen.findByRole("option", {
        name: optionName,
        selected: true,
      });
      expect(option).toBeVisible();
    });
  });

  describe("handles user selecting a team", () => {
    const mockedOnChange = jest.fn();
    const optionToSelect = "Ospo";
    const optionId = "1003";

    beforeEach(async () => {
      mockGetTeams.mockResolvedValue(mockedTeamsResponse);

      customRender(<SelectTeam onChange={mockedOnChange} />, {
        queryClient: true,
        memoryRouter: true,
      });
      await waitForElementToBeRemoved(
        screen.getByTestId("select-team-loading")
      );
    });

    afterEach(() => {
      jest.resetAllMocks();
      cleanup();
    });

    it("sets the team the user choose as active option", async () => {
      const select = screen.getByRole("combobox", {
        name: filterLabel,
      });
      const option = screen.getByRole("option", { name: optionToSelect });

      await userEvent.selectOptions(select, option);

      expect(select).toHaveValue(optionId);
      expect(select).toHaveDisplayValue(optionToSelect);
    });
  });

  describe("updates the search param to preserve team in url", () => {
    const mockedOnChange = jest.fn();
    const optionToSelect = "DevRel";
    const optionId = "1004";

    beforeEach(async () => {
      mockGetTeams.mockResolvedValue(mockedTeamsResponse);
      customRender(<SelectTeam onChange={mockedOnChange} />, {
        queryClient: true,
        browserRouter: true,
      });
      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeVisible();
      });
    });

    afterEach(() => {
      // resets url to get to clean state again
      window.history.pushState({}, "No page title", "/");
      jest.resetAllMocks();
      cleanup();
    });

    it("shows no search param by default", async () => {
      expect(window.location.search).toEqual("");
    });

    it("sets `DevRel` as search param when user selected it", async () => {
      const select = screen.getByRole("combobox", {
        name: filterLabel,
      });

      const option = screen.getByRole("option", { name: optionToSelect });

      await userEvent.selectOptions(select, option);

      await waitFor(() => {
        expect(window.location.search).toEqual(`?team=${optionId}`);
      });
    });
  });
});
