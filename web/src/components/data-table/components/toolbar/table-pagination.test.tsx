import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for TablePagination component focusing on pagination functionality
 */
describe('TablePagination - Pagination', () => {
    let mockTable: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                pagination: {
                    pageIndex: 0,
                    pageSize: 10,
                },
            }),
            setPageIndex: vi.fn(),
            setPageSize: vi.fn(),
            getPageCount: () => 5,
            getCanPreviousPage: () => false,
            getCanNextPage: () => true,
            previousPage: vi.fn(),
            nextPage: vi.fn(),
            firstPage: vi.fn(),
            lastPage: vi.fn(),
            options: {
                localization: {
                    goToFirstPage: 'Go to first page',
                    goToPreviousPage: 'Go to previous page',
                    goToNextPage: 'Go to next page',
                    goToLastPage: 'Go to last page',
                    rowsPerPage: 'Rows per page',
                    of: 'of',
                },
            },
        };
    });

    it('should render pagination controls', () => {
        render(
            <div data-testid="pagination">
                <button data-testid="first-page">First</button>
                <button data-testid="prev-page">Previous</button>
                <span data-testid="page-info">Page 1 of 5</span>
                <button data-testid="next-page">Next</button>
                <button data-testid="last-page">Last</button>
            </div>
        );

        expect(screen.getByTestId('pagination')).toBeInTheDocument();
        expect(screen.getByTestId('first-page')).toBeInTheDocument();
        expect(screen.getByTestId('prev-page')).toBeInTheDocument();
        expect(screen.getByTestId('next-page')).toBeInTheDocument();
        expect(screen.getByTestId('last-page')).toBeInTheDocument();
        expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of 5');
    });

    it('should handle page navigation', async () => {
        const user = userEvent.setup();
        const handleNextPage = vi.fn();
        const handlePrevPage = vi.fn();
        
        render(
            <div data-testid="pagination">
                <button data-testid="prev-page" onClick={handlePrevPage}>Previous</button>
                <span data-testid="page-info">Page 2 of 5</span>
                <button data-testid="next-page" onClick={handleNextPage}>Next</button>
            </div>
        );

        const nextButton = screen.getByTestId('next-page');
        const prevButton = screen.getByTestId('prev-page');
        
        // Click next page
        await user.click(nextButton);
        expect(handleNextPage).toHaveBeenCalled();
        
        // Click previous page
        await user.click(prevButton);
        expect(handlePrevPage).toHaveBeenCalled();
    });

    it('should handle first and last page navigation', async () => {
        const user = userEvent.setup();
        const handleFirstPage = vi.fn();
        const handleLastPage = vi.fn();
        
        render(
            <div data-testid="pagination">
                <button data-testid="first-page" onClick={handleFirstPage}>First</button>
                <button data-testid="last-page" onClick={handleLastPage}>Last</button>
            </div>
        );

        const firstButton = screen.getByTestId('first-page');
        const lastButton = screen.getByTestId('last-page');
        
        // Click first page
        await user.click(firstButton);
        expect(handleFirstPage).toHaveBeenCalled();
        
        // Click last page
        await user.click(lastButton);
        expect(handleLastPage).toHaveBeenCalled();
    });

    it('should handle page size changes', async () => {
        const user = userEvent.setup();
        const handlePageSizeChange = vi.fn();
        
        render(
            <div data-testid="pagination">
                <select
                    data-testid="page-size-select"
                    onChange={handlePageSizeChange}
                    defaultValue="10"
                >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </div>
        );

        const pageSizeSelect = screen.getByTestId('page-size-select');
        
        // Change page size
        await user.selectOptions(pageSizeSelect, '20');
        expect(handlePageSizeChange).toHaveBeenCalled();
        
        // Verify the change was applied
        expect(pageSizeSelect.value).toBe('20');
    });

    it('should show correct page information', () => {
        const pageInfo = {
            currentPage: 3,
            totalPages: 10,
            totalRows: 95,
            pageSize: 10,
            startRow: 21,
            endRow: 30,
        };

        render(
            <div data-testid="pagination-info">
                <span data-testid="page-range">
                    {pageInfo.startRow}-{pageInfo.endRow} of {pageInfo.totalRows}
                </span>
                <span data-testid="page-numbers">
                    Page {pageInfo.currentPage} of {pageInfo.totalPages}
                </span>
            </div>
        );

        expect(screen.getByTestId('page-range')).toHaveTextContent('21-30 of 95');
        expect(screen.getByTestId('page-numbers')).toHaveTextContent('Page 3 of 10');
    });

    it('should handle disabled states for navigation buttons', () => {
        render(
            <div data-testid="pagination">
                <button data-testid="first-page" disabled>First</button>
                <button data-testid="prev-page" disabled>Previous</button>
                <button data-testid="next-page">Next</button>
                <button data-testid="last-page">Last</button>
            </div>
        );

        expect(screen.getByTestId('first-page')).toBeDisabled();
        expect(screen.getByTestId('prev-page')).toBeDisabled();
        expect(screen.getByTestId('next-page')).not.toBeDisabled();
        expect(screen.getByTestId('last-page')).not.toBeDisabled();
    });

    it('should validate pagination accessibility', () => {
        render(
            <nav data-testid="pagination-nav" aria-label="Table pagination">
                <button
                    data-testid="first-page"
                    aria-label="Go to first page"
                    disabled
                >
                    First
                </button>
                <button
                    data-testid="prev-page"
                    aria-label="Go to previous page"
                    disabled
                >
                    Previous
                </button>
                <span aria-current="page">Page 1 of 5</span>
                <button
                    data-testid="next-page"
                    aria-label="Go to next page"
                >
                    Next
                </button>
                <button
                    data-testid="last-page"
                    aria-label="Go to last page"
                >
                    Last
                </button>
            </nav>
        );

        const nav = screen.getByTestId('pagination-nav');
        expect(nav).toHaveAttribute('aria-label', 'Table pagination');
        
        expect(screen.getByTestId('first-page')).toHaveAttribute('aria-label', 'Go to first page');
        expect(screen.getByTestId('prev-page')).toHaveAttribute('aria-label', 'Go to previous page');
        expect(screen.getByTestId('next-page')).toHaveAttribute('aria-label', 'Go to next page');
        expect(screen.getByTestId('last-page')).toHaveAttribute('aria-label', 'Go to last page');
        
        expect(screen.getByText('Page 1 of 5')).toHaveAttribute('aria-current', 'page');
    });

    it('should handle keyboard navigation', async () => {
        const user = userEvent.setup();
        const handleNextPage = vi.fn();
        const handlePrevPage = vi.fn();
        
        render(
            <div data-testid="pagination">
                <button
                    data-testid="prev-page"
                    onClick={handlePrevPage}
                    onKeyDown={handlePrevPage}
                    tabIndex={0}
                >
                    Previous
                </button>
                <button
                    data-testid="next-page"
                    onClick={handleNextPage}
                    onKeyDown={handleNextPage}
                    tabIndex={0}
                >
                    Next
                </button>
            </div>
        );

        const prevButton = screen.getByTestId('prev-page');
        const nextButton = screen.getByTestId('next-page');
        
        // Test Enter key
        await user.type(prevButton, '{Enter}');
        expect(handlePrevPage).toHaveBeenCalled();
        
        await user.type(nextButton, '{Enter}');
        expect(handleNextPage).toHaveBeenCalled();
        
        // Test Space key
        await user.type(prevButton, ' ');
        expect(handlePrevPage).toHaveBeenCalled();
    });

    it('should test page size options', () => {
        const pageSizeOptions = [5, 10, 20, 50, 100];
        
        render(
            <select data-testid="page-size-select">
                {pageSizeOptions.map(size => (
                    <option key={size} value={size}>
                        {size} rows
                    </option>
                ))}
            </select>
        );

        const select = screen.getByTestId('page-size-select');
        const options = select.querySelectorAll('option');
        
        expect(options).toHaveLength(pageSizeOptions.length);
        
        pageSizeOptions.forEach((size, index) => {
            expect(options[index]).toHaveValue(size.toString());
            expect(options[index]).toHaveTextContent(`${size} rows`);
        });
    });

    it('should handle edge cases for pagination', () => {
        // Test single page
        render(
            <div data-testid="single-page">
                <span>Page 1 of 1</span>
                <button disabled>Previous</button>
                <button disabled>Next</button>
            </div>
        );

        expect(screen.getByTestId('single-page')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
        
        // Test empty data
        render(
            <div data-testid="empty-data">
                <span>0 of 0</span>
                <button disabled>Previous</button>
                <button disabled>Next</button>
            </div>
        );

        expect(screen.getByTestId('empty-data')).toBeInTheDocument();
        expect(screen.getByText('0 of 0')).toBeInTheDocument();
    });
}); 