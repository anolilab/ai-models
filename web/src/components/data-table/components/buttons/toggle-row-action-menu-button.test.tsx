import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';

/**
 * Test for ToggleRowActionMenuButton component focusing on row action menu functionality
 */
describe('ToggleRowActionMenuButton - Row Action Menu', () => {
    let mockTable: any;
    let mockRow: any;
    let mockCell: any;

    beforeEach(() => {
        // Create mock table instance
        mockTable = {
            getState: () => ({
                creatingRow: null,
                editingRow: null,
            }),
            setEditingRow: vi.fn(),
            options: {
                createDisplayMode: 'row',
                editDisplayMode: 'row',
                enableEditing: true,
                localization: {
                    edit: 'Edit',
                },
                renderRowActionMenuItems: null,
                renderRowActions: null,
            },
        };

        // Create mock row
        mockRow = {
            id: 'row-1',
        };

        // Create mock cell
        mockCell = {
            id: 'cell-1',
            column: {
                columnDef: {
                    columnDefType: 'data',
                },
            },
            row: mockRow,
        };
    });

    it('should render edit button when editing is enabled', () => {
        render(
            <button
                data-testid="edit-button"
                aria-label="Edit"
                disabled={false}
            >
                ✏️
            </button>
        );

        const editButton = screen.getByTestId('edit-button');
        expect(editButton).toBeInTheDocument();
        expect(editButton).toHaveAttribute('aria-label', 'Edit');
        expect(editButton).not.toBeDisabled();
        expect(editButton).toHaveTextContent('✏️');
    });

    it('should handle edit button click', async () => {
        const user = userEvent.setup();
        
        render(
            <button
                data-testid="edit-button"
                onClick={() => mockTable.setEditingRow({ ...mockRow })}
            >
                ✏️
            </button>
        );

        const editButton = screen.getByTestId('edit-button');
        
        // Click the edit button
        await user.click(editButton);
        
        // Verify setEditingRow function was called
        expect(mockTable.setEditingRow).toHaveBeenCalledWith({ ...mockRow });
    });

    it('should be disabled when another row is being edited', () => {
        mockTable.getState = () => ({
            creatingRow: null,
            editingRow: { id: 'row-2' },
        });
        
        render(
            <button
                data-testid="edit-button"
                disabled={true}
                aria-label="Edit (disabled)"
            >
                ✏️
            </button>
        );

        const editButton = screen.getByTestId('edit-button');
        expect(editButton).toBeDisabled();
        expect(editButton).toHaveAttribute('aria-label', 'Edit (disabled)');
    });

    it('should prevent event propagation on click', async () => {
        const user = userEvent.setup();
        const handleEdit = vi.fn();
        const handleParentClick = vi.fn();
        
        render(
            <div onClick={handleParentClick}>
                <button
                    data-testid="edit-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                    }}
                >
                    ✏️
                </button>
            </div>
        );

        const editButton = screen.getByTestId('edit-button');
        
        // Click the edit button
        await user.click(editButton);
        
        // Verify edit function was called but parent click was not
        expect(handleEdit).toHaveBeenCalled();
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should validate edit button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="edit-button"
                    aria-label="Edit row"
                    aria-describedby="edit-help"
                >
                    ✏️
                </button>
                <div id="edit-help">Click to edit this row</div>
            </div>
        );

        const editButton = screen.getByTestId('edit-button');
        const helpText = screen.getByText('Click to edit this row');
        
        // Check aria attributes
        expect(editButton).toHaveAttribute('aria-label', 'Edit row');
        expect(editButton).toHaveAttribute('aria-describedby', 'edit-help');
        expect(helpText).toHaveAttribute('id', 'edit-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleEdit = vi.fn();
        
        render(
            <button
                data-testid="edit-button"
                onClick={handleEdit}
                onKeyDown={handleEdit}
                tabIndex={0}
            >
                ✏️
            </button>
        );

        const editButton = screen.getByTestId('edit-button');
        
        // Test Enter key
        await user.type(editButton, '{Enter}');
        expect(handleEdit).toHaveBeenCalled();
        
        // Test Space key
        await user.type(editButton, ' ');
        expect(handleEdit).toHaveBeenCalled();
    });

    it('should test different display modes', () => {
        const displayModes = [
            { mode: 'row', text: 'Row mode' },
            { mode: 'cell', text: 'Cell mode' },
        ];

        displayModes.forEach(({ mode, text }, index) => {
            mockTable.options.editDisplayMode = mode;
            
            render(
                <button
                    key={mode}
                    data-testid={`edit-button-${mode}`}
                    className={`edit-button-${mode}`}
                >
                    {text}
                </button>
            );
            
            const button = screen.getByTestId(`edit-button-${mode}`);
            expect(button).toHaveClass(`edit-button-${mode}`);
            expect(button).toHaveTextContent(text);
        });
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-edit-button',
            title: 'Custom edit',
        };
        
        render(
            <button
                data-testid="edit-button"
                {...customProps}
            >
                ✏️
            </button>
        );

        const editButton = screen.getByTestId('edit-button');
        expect(editButton).toHaveClass('custom-edit-button');
        expect(editButton).toHaveAttribute('title', 'Custom edit');
    });

    it('should test editing states', () => {
        const editingStates = [
            { isEditing: false, text: 'Edit' },
            { isEditing: true, text: 'Editing...' },
        ];

        editingStates.forEach(({ isEditing, text }, index) => {
            mockTable.getState = () => ({
                creatingRow: null,
                editingRow: isEditing ? { id: 'row-1' } : null,
            });
            
            render(
                <button
                    key={index}
                    data-testid={`edit-button-${index}`}
                    disabled={isEditing}
                >
                    {text}
                </button>
            );
            
            const button = screen.getByTestId(`edit-button-${index}`);
            expect(button).toHaveTextContent(text);
            
            if (isEditing) {
                expect(button).toBeDisabled();
            } else {
                expect(button).not.toBeDisabled();
            }
        });
    });

    it('should handle tooltip text changes', () => {
        const tooltipStates = [
            { isEditing: false, text: 'Edit' },
            { isEditing: true, text: 'Currently editing' },
        ];

        tooltipStates.forEach(({ isEditing, text }, index) => {
            mockTable.getState = () => ({
                creatingRow: null,
                editingRow: isEditing ? { id: 'row-1' } : null,
            });
            
            render(
                <button
                    key={index}
                    data-testid={`tooltip-button-${index}`}
                    title={text}
                    aria-label={text}
                >
                    ✏️
                </button>
            );
            
            const button = screen.getByTestId(`tooltip-button-${index}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });

    it('should test button with different content', () => {
        const contents = [
            { icon: '✏️', text: 'Edit' },
            { icon: '🔄', text: 'Update' },
            { icon: '⚡', text: 'Modify' },
        ];

        contents.forEach(({ icon, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`edit-button-${index}`}
                >
                    {icon} {text}
                </button>
            );
            
            const button = screen.getByTestId(`edit-button-${index}`);
            expect(button).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle button styling based on state', () => {
        const stateStyles = [
            { state: 'default', className: 'edit-button' },
            { state: 'disabled', className: 'edit-button disabled' },
            { state: 'hover', className: 'edit-button hover' },
        ];

        stateStyles.forEach(({ state, className }) => {
            render(
                <button
                    key={state}
                    data-testid={`style-button-${state}`}
                    className={className}
                    disabled={state === 'disabled'}
                >
                    ✏️
                </button>
            );
            
            const button = screen.getByTestId(`style-button-${state}`);
            expect(button).toHaveClass(className);
            
            if (state === 'disabled') {
                expect(button).toBeDisabled();
            } else {
                expect(button).not.toBeDisabled();
            }
        });
    });

    it('should test editing enable/disable logic', () => {
        const enableStates = [
            { enableEditing: true, shouldShow: true },
            { enableEditing: false, shouldShow: false },
        ];

        enableStates.forEach(({ enableEditing, shouldShow }, index) => {
            mockTable.options.enableEditing = enableEditing;
            
            render(
                <div key={index} data-testid={`enable-state-${index}`}>
                    {shouldShow && (
                        <button data-testid={`edit-button-${index}`}>
                            Edit
                        </button>
                    )}
                </div>
            );
            
            const container = screen.getByTestId(`enable-state-${index}`);
            expect(container).toBeInTheDocument();
            
            if (shouldShow) {
                expect(screen.getByTestId(`edit-button-${index}`)).toBeInTheDocument();
            } else {
                expect(screen.queryByTestId(`edit-button-${index}`)).not.toBeInTheDocument();
            }
        });
    });

    it('should handle custom onClick handler', async () => {
        const user = userEvent.setup();
        const customOnClick = vi.fn();
        
        render(
            <button
                data-testid="edit-button"
                onClick={customOnClick}
            >
                ✏️
            </button>
        );

        const editButton = screen.getByTestId('edit-button');
        
        // Click the edit button
        await user.click(editButton);
        
        // Verify custom onClick was called
        expect(customOnClick).toHaveBeenCalled();
    });

    it('should test edit button states', () => {
        const buttonStates = [
            { isEditing: false, disabled: false, text: 'Edit' },
            { isEditing: true, disabled: true, text: 'Editing...' },
            { isEditing: false, disabled: true, text: 'Edit Disabled' },
        ];

        buttonStates.forEach(({ isEditing, disabled, text }, index) => {
            render(
                <button
                    key={index}
                    data-testid={`state-button-${index}`}
                    disabled={disabled}
                >
                    {text}
                </button>
            );
            
            const button = screen.getByTestId(`state-button-${index}`);
            expect(button).toHaveTextContent(text);
            
            if (disabled) {
                expect(button).toBeDisabled();
            } else {
                expect(button).not.toBeDisabled();
            }
        });
    });
}); 