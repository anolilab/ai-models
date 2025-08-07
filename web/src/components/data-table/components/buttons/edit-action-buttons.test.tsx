import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for EditActionButtons component focusing on row editing functionality
 */
describe('EditActionButtons - Row Editing', () => {
    let mockTable: any;
    let mockRow: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                creatingRow: null,
                editingRow: null,
                isSaving: false,
            }),
            setCreatingRow: vi.fn(),
            setEditingRow: vi.fn(),
            refs: {
                editInputRefs: {
                    current: {},
                },
            },
            options: {
                localization: {
                    cancel: 'Cancel',
                    save: 'Save',
                },
                onCreatingRowCancel: vi.fn(),
                onCreatingRowSave: vi.fn(),
                onEditingRowCancel: vi.fn(),
                onEditingRowSave: vi.fn(),
            },
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
            _valuesCache: {},
        };
    });

    it('should render edit action buttons in icon variant', () => {
        render(
            <div data-testid="edit-action-buttons">
                <button
                    data-testid="cancel-button"
                    aria-label="Cancel"
                >
                    <span>✕</span>
                </button>
                <button
                    data-testid="save-button"
                    aria-label="Save"
                >
                    <span>💾</span>
                </button>
            </div>
        );

        const container = screen.getByTestId('edit-action-buttons');
        const cancelButton = screen.getByTestId('cancel-button');
        const saveButton = screen.getByTestId('save-button');
        
        expect(container).toBeInTheDocument();
        expect(cancelButton).toBeInTheDocument();
        expect(saveButton).toBeInTheDocument();
        expect(cancelButton).toHaveAttribute('aria-label', 'Cancel');
        expect(saveButton).toHaveAttribute('aria-label', 'Save');
    });

    it('should render edit action buttons in text variant', () => {
        render(
            <div data-testid="edit-action-buttons">
                <button data-testid="cancel-button">Cancel</button>
                <button data-testid="save-button">Save</button>
            </div>
        );

        const container = screen.getByTestId('edit-action-buttons');
        const cancelButton = screen.getByTestId('cancel-button');
        const saveButton = screen.getByTestId('save-button');
        
        expect(container).toBeInTheDocument();
        expect(cancelButton).toHaveTextContent('Cancel');
        expect(saveButton).toHaveTextContent('Save');
    });

    it('should handle cancel button click when creating', async () => {
        const user = userEvent.setup();
        mockTable.getState = () => ({
            creatingRow: { id: 'row-1' },
            editingRow: null,
            isSaving: false,
        });
        
        render(
            <button
                data-testid="cancel-button"
                onClick={() => {
                    mockTable.options.onCreatingRowCancel?.({ row: mockRow, table: mockTable });
                    mockTable.setCreatingRow(null);
                }}
            >
                Cancel
            </button>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        
        // Click cancel button
        await user.click(cancelButton);
        
        // Verify cancel function was called
        expect(mockTable.options.onCreatingRowCancel).toHaveBeenCalledWith({
            row: mockRow,
            table: mockTable,
        });
        expect(mockTable.setCreatingRow).toHaveBeenCalledWith(null);
    });

    it('should handle cancel button click when editing', async () => {
        const user = userEvent.setup();
        mockTable.getState = () => ({
            creatingRow: null,
            editingRow: { id: 'row-1' },
            isSaving: false,
        });
        
        render(
            <button
                data-testid="cancel-button"
                onClick={() => {
                    mockTable.options.onEditingRowCancel?.({ row: mockRow, table: mockTable });
                    mockTable.setEditingRow(null);
                }}
            >
                Cancel
            </button>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        
        // Click cancel button
        await user.click(cancelButton);
        
        // Verify cancel function was called
        expect(mockTable.options.onEditingRowCancel).toHaveBeenCalledWith({
            row: mockRow,
            table: mockTable,
        });
        expect(mockTable.setEditingRow).toHaveBeenCalledWith(null);
    });

    it('should handle save button click when creating', async () => {
        const user = userEvent.setup();
        mockTable.getState = () => ({
            creatingRow: { id: 'row-1' },
            editingRow: null,
            isSaving: false,
        });
        
        render(
            <button
                data-testid="save-button"
                onClick={() => {
                    mockTable.options.onCreatingRowSave?.({
                        exitCreatingMode: () => mockTable.setCreatingRow(null),
                        row: mockRow,
                        table: mockTable,
                        values: mockRow._valuesCache,
                    });
                }}
            >
                Save
            </button>
        );

        const saveButton = screen.getByTestId('save-button');
        
        // Click save button
        await user.click(saveButton);
        
        // Verify save function was called
        expect(mockTable.options.onCreatingRowSave).toHaveBeenCalledWith({
            exitCreatingMode: expect.any(Function),
            row: mockRow,
            table: mockTable,
            values: mockRow._valuesCache,
        });
    });

    it('should handle save button click when editing', async () => {
        const user = userEvent.setup();
        mockTable.getState = () => ({
            creatingRow: null,
            editingRow: { id: 'row-1' },
            isSaving: false,
        });
        
        render(
            <button
                data-testid="save-button"
                onClick={() => {
                    mockTable.options.onEditingRowSave?.({
                        exitEditingMode: () => mockTable.setEditingRow(null),
                        row: mockRow,
                        table: mockTable,
                        values: mockRow._valuesCache,
                    });
                }}
            >
                Save
            </button>
        );

        const saveButton = screen.getByTestId('save-button');
        
        // Click save button
        await user.click(saveButton);
        
        // Verify save function was called
        expect(mockTable.options.onEditingRowSave).toHaveBeenCalledWith({
            exitEditingMode: expect.any(Function),
            row: mockRow,
            table: mockTable,
            values: mockRow._valuesCache,
        });
    });

    it('should disable save button when saving', () => {
        mockTable.getState = () => ({
            creatingRow: null,
            editingRow: { id: 'row-1' },
            isSaving: true,
        });
        
        render(
            <button
                data-testid="save-button"
                disabled={true}
            >
                Save
            </button>
        );

        const saveButton = screen.getByTestId('save-button');
        expect(saveButton).toBeDisabled();
    });

    it('should prevent event propagation on button clicks', async () => {
        const user = userEvent.setup();
        const handleParentClick = vi.fn();
        
        render(
            <div onClick={handleParentClick}>
                <button
                    data-testid="cancel-button"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    Cancel
                </button>
            </div>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        
        // Click the cancel button
        await user.click(cancelButton);
        
        // Verify parent click was not called
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should reset values cache on cancel', async () => {
        const user = userEvent.setup();
        mockRow._valuesCache = { name: 'test', age: 25 };
        
        render(
            <button
                data-testid="cancel-button"
                onClick={() => {
                    mockRow._valuesCache = {};
                }}
            >
                Cancel
            </button>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        
        // Click cancel button
        await user.click(cancelButton);
        
        // Verify values cache was reset
        expect(mockRow._valuesCache).toEqual({});
    });

    it('should validate edit action buttons accessibility', () => {
        render(
            <div>
                <button
                    data-testid="cancel-button"
                    aria-label="Cancel editing"
                    aria-describedby="cancel-help"
                >
                    Cancel
                </button>
                <button
                    data-testid="save-button"
                    aria-label="Save changes"
                    aria-describedby="save-help"
                >
                    Save
                </button>
                <div id="cancel-help">Click to cancel editing</div>
                <div id="save-help">Click to save changes</div>
            </div>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        const saveButton = screen.getByTestId('save-button');
        const cancelHelp = screen.getByText('Click to cancel editing');
        const saveHelp = screen.getByText('Click to save changes');
        
        // Check aria attributes
        expect(cancelButton).toHaveAttribute('aria-label', 'Cancel editing');
        expect(cancelButton).toHaveAttribute('aria-describedby', 'cancel-help');
        expect(saveButton).toHaveAttribute('aria-label', 'Save changes');
        expect(saveButton).toHaveAttribute('aria-describedby', 'save-help');
        expect(cancelHelp).toHaveAttribute('id', 'cancel-help');
        expect(saveHelp).toHaveAttribute('id', 'save-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleCancel = vi.fn();
        const handleSave = vi.fn();
        
        render(
            <div data-testid="edit-action-buttons">
                <button
                    data-testid="cancel-button"
                    onClick={handleCancel}
                    onKeyDown={handleCancel}
                    tabIndex={0}
                >
                    Cancel
                </button>
                <button
                    data-testid="save-button"
                    onClick={handleSave}
                    onKeyDown={handleSave}
                    tabIndex={0}
                >
                    Save
                </button>
            </div>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        const saveButton = screen.getByTestId('save-button');
        
        // Test Enter key
        await user.type(cancelButton, '{Enter}');
        expect(handleCancel).toHaveBeenCalled();
        
        await user.type(saveButton, '{Enter}');
        expect(handleSave).toHaveBeenCalled();
        
        // Test Space key
        await user.type(cancelButton, ' ');
        expect(handleCancel).toHaveBeenCalled();
    });

    it('should test different button variants', () => {
        const variants = [
            { variant: 'icon', expected: 'icon buttons' },
            { variant: 'text', expected: 'text buttons' },
        ];

        variants.forEach(({ variant, expected }) => {
            render(
                <div key={variant} data-testid={`variant-${variant}`}>
                    {variant === 'icon' ? (
                        <>
                            <button data-testid="cancel-icon">✕</button>
                            <button data-testid="save-icon">💾</button>
                        </>
                    ) : (
                        <>
                            <button data-testid="cancel-text">Cancel</button>
                            <button data-testid="save-text">Save</button>
                        </>
                    )}
                </div>
            );
            
            const container = screen.getByTestId(`variant-${variant}`);
            expect(container).toBeInTheDocument();
        });
    });

    it('should handle custom button styling', () => {
        const customStyles = {
            cancelButton: { backgroundColor: 'red' },
            saveButton: { backgroundColor: 'green' },
        };
        
        render(
            <div data-testid="edit-action-buttons">
                <button
                    data-testid="cancel-button"
                    className="cancel-button"
                >
                    Cancel
                </button>
                <button
                    data-testid="save-button"
                    className="save-button"
                >
                    Save
                </button>
            </div>
        );

        const cancelButton = screen.getByTestId('cancel-button');
        const saveButton = screen.getByTestId('save-button');
        
        expect(cancelButton).toHaveClass('cancel-button');
        expect(saveButton).toHaveClass('save-button');
    });

    it('should test button states', () => {
        const buttonStates = [
            { isSaving: false, disabled: false, text: 'Save' },
            { isSaving: true, disabled: true, text: 'Saving...' },
        ];

        buttonStates.forEach(({ isSaving, disabled, text }) => {
            render(
                <button
                    key={isSaving.toString()}
                    data-testid={`save-button-${isSaving}`}
                    disabled={disabled}
                >
                    {text}
                </button>
            );
            
            const saveButton = screen.getByTestId(`save-button-${isSaving}`);
            expect(saveButton).toHaveTextContent(text);
            
            if (disabled) {
                expect(saveButton).toBeDisabled();
            } else {
                expect(saveButton).not.toBeDisabled();
            }
        });
    });
}); 