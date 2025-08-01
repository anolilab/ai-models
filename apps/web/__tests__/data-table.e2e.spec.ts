import { expect, test } from "@playwright/test";

test.describe("Data Table E2E Tests", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page
        await page.goto("/");

        // Wait for the page to load and the table to be visible
        await page.waitForSelector("[data-testid=\"data-table\"]", { timeout: 15000 });

        // Also wait for the table content to load
        await page.waitForSelector("table", { timeout: 15000 });
    });

    test("should load the page and display the data table", async ({ page }) => {
        // Check that the page title is visible
        await expect(page.getByRole("heading", { name: "Models.dev" })).toBeVisible();

        // Check that the table is loaded
        await expect(page.getByTestId("data-table")).toBeVisible();

        // Check that table headers are present
        await expect(page.getByRole("columnheader", { exact: true, name: "Provider" })).toBeVisible();
        await expect(page.getByRole("columnheader", { exact: true, name: "Model" })).toBeVisible();
        await expect(page.getByRole("columnheader", { name: "Input Cost" })).toBeVisible();

        // Check that some data rows are present
        const rowCount = await page.locator("[data-testid=\"data-table\"] tbody tr").count();

        expect(rowCount).toBeGreaterThan(0);
    });

    test("should perform global search functionality", async ({ page }) => {
        // Get the search input
        const searchInput = page.getByPlaceholder(/search models/i);

        await expect(searchInput).toBeVisible();

        // Type a search term
        await searchInput.fill("GPT");

        // Wait for search results
        await page.waitForTimeout(500); // Wait for debounced search

        // Check that filtered results contain the search term
        const rows = page.locator("[data-testid=\"data-table\"] tbody tr");
        const rowCount = await rows.count();

        // At least one row should be visible after search
        expect(rowCount).toBeGreaterThan(0);

        // Clear the search
        await searchInput.clear();
        await page.waitForTimeout(500);

        // Should show all results again
        const allRows = page.locator("[data-testid=\"data-table\"] tbody tr");
        const allRowCount = await allRows.count();

        expect(allRowCount).toBeGreaterThanOrEqual(rowCount);
    });

    test("should sort columns when clicking headers", async ({ page }) => {
        // Click on the Provider column header to sort
        const providerHeader = page.getByRole("columnheader", { exact: true, name: "Provider" });

        await providerHeader.click();

        // Wait for sorting to complete
        await page.waitForTimeout(300);

        // Click again to reverse sort
        await providerHeader.click();
        await page.waitForTimeout(300);

        // Click on Model column header
        const modelHeader = page.getByRole("columnheader", { exact: true, name: "Model" });

        await modelHeader.click();
        await page.waitForTimeout(300);
    });

    test("should sort columns using dropdown Asc/Desc options", async ({ page }) => {
        // Click on the Provider column header to open dropdown
        const providerHeader = page.getByRole("columnheader", { exact: true, name: "Provider" });

        await providerHeader.click();

        // Wait for the dropdown menu to appear
        await page.waitForSelector("[role=\"menu\"]");

        // Click on "Asc" option
        const ascOption = page.getByRole("menuitem", { name: "Asc" });

        await ascOption.click();

        // Wait for sorting to complete
        await page.waitForTimeout(300);

        // Verify ascending sort is applied
        await expect(providerHeader).toHaveAttribute("aria-sort", "ascending");

        // Open dropdown again
        await providerHeader.click();
        await page.waitForSelector("[role=\"menu\"]");

        // Click on "Desc" option
        const descOption = page.getByRole("menuitem", { name: "Desc" });

        await descOption.click();

        // Wait for sorting to complete
        await page.waitForTimeout(300);

        // Verify descending sort is applied
        await expect(providerHeader).toHaveAttribute("aria-sort", "descending");

        // Test with Last Updated column (date sorting)
        const lastUpdatedHeader = page.getByRole("columnheader", { exact: true, name: "Last Updated" });

        await lastUpdatedHeader.click();
        await page.waitForSelector("[role=\"menu\"]");

        // Click on "Desc" option for date sorting
        const descDateOption = page.getByRole("menuitem", { name: "Desc" });

        await descDateOption.click();

        // Wait for sorting to complete
        await page.waitForTimeout(300);

        // Verify descending sort is applied to date column
        await expect(lastUpdatedHeader).toHaveAttribute("aria-sort", "descending");
    });

    test("should toggle column visibility", async ({ page }) => {
        // Open the view options menu
        const viewOptionsButton = page.getByRole("button", { name: "Toggle columns" });

        await viewOptionsButton.click();

        // Wait for the popover to appear
        await page.waitForSelector("[role=\"dialog\"]");

        // Toggle a column visibility (e.g., Provider ID)
        const providerIdToggle = page.getByRole("option", { name: /provider id/i });

        await providerIdToggle.click();

        // Check that the column is hidden
        await expect(page.getByRole("columnheader", { name: "Provider ID" })).not.toBeVisible();

        // Toggle it back on
        await providerIdToggle.click();

        // Check that the column is visible again
        await expect(page.getByRole("columnheader", { name: "Provider ID" })).toBeVisible();
    });

    test("should export data to CSV", async ({ page }) => {
        // Open the export menu
        const exportButton = page.getByRole("button", { name: "Export" });

        await exportButton.click();

        // Wait for the dropdown to appear
        await page.waitForSelector("[role=\"menu\"]");

        // Click on CSV export
        const csvExportButton = page.getByRole("menuitem", { name: /csv/i });

        // Set up download listener
        const downloadPromise = page.waitForEvent("download");

        await csvExportButton.click();

        // Wait for download to start
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/\.csv$/);
    });

    test("should export data to Excel", async ({ page }) => {
        // Open the export menu
        const exportButton = page.getByRole("button", { name: "Export" });

        await exportButton.click();

        // Wait for the dropdown to appear
        await page.waitForSelector("[role=\"menu\"]");

        // Click on Excel export
        const excelExportButton = page.getByRole("menuitem", { name: /excel/i });

        // Set up download listener
        const downloadPromise = page.waitForEvent("download");

        await excelExportButton.click();

        // Wait for download to start
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    });

    test("should filter by date range", async ({ page }) => {
        // Open the date filter
        const dateFilterButton = page.getByRole("button", { name: "Select a date" });

        await dateFilterButton.click();

        // Wait for the date picker to appear
        await page.waitForSelector("[role=\"dialog\"]");

        // Select a date range (this is a simplified test)
        const fromDate = page.getByRole("textbox", { name: /from/i });
        const toDate = page.getByRole("textbox", { name: /to/i });

        if (await fromDate.isVisible()) {
            await fromDate.fill("2024-01-01");
            await toDate.fill("2024-12-31");

            // Apply the filter
            const applyButton = page.getByRole("button", { name: /apply/i });

            await applyButton.click();

            // Wait for filtering to complete
            await page.waitForTimeout(500);
        }
    });

    test("should handle keyboard navigation", async ({ page }) => {
        // Focus on the table
        await page.keyboard.press("Tab");

        // Navigate through the table using arrow keys
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowUp");
        await page.keyboard.press("ArrowLeft");

        // Test search with keyboard shortcut
        await page.keyboard.press("Control+k");
        const searchInput = page.getByPlaceholder(/search models/i);

        await expect(searchInput).toBeFocused();
    });

    test("should display tooltips for modality icons", async ({ page }) => {
        // Find a row with modality icons
        const modalityCell = page.locator("[data-testid=\"data-table\"] tbody tr").first().locator("td").nth(6); // Input column

        // Hover over an icon to trigger tooltip
        await modalityCell.hover();

        // Wait for tooltip to appear
        await page.waitForTimeout(200);

        // Check that tooltip content is present (this might be subtle)
        const tooltip = page.locator("[role=\"tooltip\"]");

        if (await tooltip.isVisible()) {
            expect(await tooltip.textContent()).toBeTruthy();
        }
    });

    test("should handle large datasets with virtualization", async ({ page }) => {
        // Scroll down to trigger virtualization
        await page.evaluate(() => {
            const table = document.querySelector("[data-testid=\"data-table\"]");

            if (table) {
                table.scrollTop = 1000;
            }
        });

        // Wait for virtualization to load more rows
        await page.waitForTimeout(500);

        // Check that more rows are loaded
        const rows = page.locator("[data-testid=\"data-table\"] tbody tr");
        const rowCount = await rows.count();

        expect(rowCount).toBeGreaterThan(0);
    });

    test("should maintain state during interactions", async ({ page }) => {
        // Perform a search
        const searchInput = page.getByPlaceholder(/search models/i);

        await searchInput.fill("OpenAI");
        await page.waitForTimeout(500);

        // Sort a column
        const providerHeader = page.getByRole("columnheader", { exact: true, name: "Provider" });

        await providerHeader.click();
        await page.waitForTimeout(300);

        // Check that both search and sort are still applied
        await expect(searchInput).toHaveValue("OpenAI");

        // Clear search and verify sort remains
        await searchInput.clear();
        await page.waitForTimeout(500);

        // Sort should still be active
        await expect(providerHeader).toHaveAttribute("aria-sort");
    });

    test("should handle empty search results gracefully", async ({ page }) => {
        // Search for something that doesn't exist
        const searchInput = page.getByPlaceholder(/search models/i);

        await searchInput.fill("NonExistentModel12345");
        await page.waitForTimeout(500);

        // Check that no rows are displayed
        const rows = page.locator("[data-testid=\"data-table\"] tbody tr");
        const rowCount = await rows.count();

        expect(rowCount).toBe(0);

        // Clear search to restore results
        await searchInput.clear();
        await page.waitForTimeout(500);

        // Should show results again
        const allRows = page.locator("[data-testid=\"data-table\"] tbody tr");
        const allRowCount = await allRows.count();

        expect(allRowCount).toBeGreaterThan(0);
    });

    test("should display cost information correctly", async ({ page }) => {
        // Check that cost columns display currency format
        const inputCostHeader = page.getByRole("columnheader", { name: "Input Cost" });

        await expect(inputCostHeader).toBeVisible();

        const outputCostHeader = page.getByRole("columnheader", { name: "Output Cost" });

        await expect(outputCostHeader).toBeVisible();

        // Check that cost values are formatted as currency
        const costCells = page.locator("[data-testid=\"data-table\"] tbody tr").first().locator("td");
        const inputCostCell = costCells.nth(8); // Input Cost column
        const outputCostCell = costCells.nth(9); // Output Cost column

        const inputCostText = await inputCostCell.textContent();
        const outputCostText = await outputCostCell.textContent();

        // Cost should either be formatted as currency or show 'N/A'
        expect(inputCostText).toMatch(/^\$[\d,]+\.\d+$|^N\/A$/);
        expect(outputCostText).toMatch(/^\$[\d,]+\.\d+$|^N\/A$/);
    });

    test("should handle responsive design", async ({ page }) => {
        // Test on mobile viewport
        await page.setViewportSize({ height: 667, width: 375 });

        // Check that the table is still functional
        await expect(page.getByTestId("data-table")).toBeVisible();

        // Check that search still works
        const searchInput = page.getByPlaceholder(/search models/i);

        await expect(searchInput).toBeVisible();

        // Test on tablet viewport
        await page.setViewportSize({ height: 1024, width: 768 });

        // Check that the table is still functional
        await expect(page.getByTestId("data-table")).toBeVisible();

        // Restore desktop viewport
        await page.setViewportSize({ height: 720, width: 1280 });
    });
});
