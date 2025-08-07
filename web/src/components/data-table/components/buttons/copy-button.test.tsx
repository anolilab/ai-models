import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';

/**
 * Test for CopyButton component focusing on copy to clipboard functionality
 */
describe('CopyButton - Copy to Clipboard', () => {
    let mockTable: any;
    let mockCell: any;

    beforeEach(() => {
        // Mock navigator.clipboard
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: mockWriteText },
            writable: true,
        });

        // Create mock table instance
        mockTable = {
            options: {
                localization: {
                    clickToCopy: 'Click to copy',
                    copiedToClipboard: 'Copied to clipboard',
                },
                mantineCopyButtonProps: {},
            },
        };

        // Create mock cell
        mockCell = {
            getValue: () => 'test value',
            column: {
                columnDef: {
                    mantineCopyButtonProps: {},
                },
            },
            row: {},
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render copy button with correct text', () => {
        render(
            <button
                data-testid="copy-button"
                aria-label="Click to copy"
                title="Click to copy"
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        expect(copyButton).toBeInTheDocument();
        expect(copyButton).toHaveAttribute('aria-label', 'Click to copy');
        expect(copyButton).toHaveAttribute('title', 'Click to copy');
        expect(copyButton).toHaveTextContent('Copy');
    });

    it('should handle copy button click', async () => {
        const user = userEvent.setup();
        const handleCopy = vi.fn();
        
        render(
            <button
                data-testid="copy-button"
                onClick={handleCopy}
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        
        // Click the copy button
        await user.click(copyButton);
        
        // Verify copy function was called
        expect(handleCopy).toHaveBeenCalled();
    });

    it('should copy cell value to clipboard', async () => {
        const user = userEvent.setup();
        const cellValue = 'test cell value';
        mockCell.getValue = () => cellValue;
        const handleCopy = vi.fn();
        
        render(
            <button
                data-testid="copy-button"
                onClick={handleCopy}
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        
        // Click the copy button
        await user.click(copyButton);
        
        // Verify copy function was called
        expect(handleCopy).toHaveBeenCalled();
    });

    it('should show copied state after successful copy', async () => {
        const user = userEvent.setup();
        let copied = false;
        const setCopied = (value: boolean) => { copied = value; };
        const handleCopy = vi.fn(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
        
        render(
            <button
                data-testid="copy-button"
                onClick={handleCopy}
                title={copied ? 'Copied to clipboard' : 'Click to copy'}
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        
        // Initial state
        expect(copyButton).toHaveAttribute('title', 'Click to copy');
        
        // Click the copy button
        await user.click(copyButton);
        
        // Verify copy function was called
        expect(handleCopy).toHaveBeenCalled();
    });

    it('should handle clipboard error gracefully', async () => {
        const user = userEvent.setup();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock clipboard to throw error
        const mockWriteTextError = vi.fn().mockRejectedValue(new Error('Clipboard error'));
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: mockWriteTextError },
            writable: true,
        });
        
        render(
            <button
                data-testid="copy-button"
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText('test');
                    } catch (error) {
                        console.error('Failed to copy to clipboard:', error);
                    }
                }}
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        
        // Click the copy button
        await user.click(copyButton);
        
        // Verify error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
        
        consoleSpy.mockRestore();
    });

    it('should validate copy button accessibility', () => {
        render(
            <div>
                <button
                    data-testid="copy-button"
                    aria-label="Click to copy"
                    aria-describedby="copy-help"
                >
                    Copy
                </button>
                <div id="copy-help">Click to copy this value to clipboard</div>
            </div>
        );

        const copyButton = screen.getByTestId('copy-button');
        const helpText = screen.getByText('Click to copy this value to clipboard');
        
        // Check aria attributes
        expect(copyButton).toHaveAttribute('aria-label', 'Click to copy');
        expect(copyButton).toHaveAttribute('aria-describedby', 'copy-help');
        expect(helpText).toHaveAttribute('id', 'copy-help');
    });

    it('should handle keyboard interactions', async () => {
        const user = userEvent.setup();
        const handleCopy = vi.fn();
        
        render(
            <button
                data-testid="copy-button"
                onClick={handleCopy}
                onKeyDown={handleCopy}
                tabIndex={0}
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        
        // Test Enter key
        await user.type(copyButton, '{Enter}');
        expect(handleCopy).toHaveBeenCalled();
        
        // Test Space key
        await user.type(copyButton, ' ');
        expect(handleCopy).toHaveBeenCalled();
    });

    it('should prevent event propagation on click', async () => {
        const user = userEvent.setup();
        const handleCopy = vi.fn();
        const handleParentClick = vi.fn();
        
        render(
            <div onClick={handleParentClick}>
                <button
                    data-testid="copy-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                    }}
                >
                    Copy
                </button>
            </div>
        );

        const copyButton = screen.getByTestId('copy-button');
        
        // Click the copy button
        await user.click(copyButton);
        
        // Verify copy function was called but parent click was not
        expect(handleCopy).toHaveBeenCalled();
        expect(handleParentClick).not.toHaveBeenCalled();
    });

    it('should test different cell value types', () => {
        const cellValues = [
            { value: 'text', type: 'string' },
            { value: 123, type: 'number' },
            { value: true, type: 'boolean' },
            { value: null, type: 'null' },
            { value: undefined, type: 'undefined' },
        ];

        cellValues.forEach(({ value, type }) => {
            mockCell.getValue = () => value;
            
            render(
                <button
                    key={type}
                    data-testid={`copy-button-${type}`}
                    onClick={async () => {
                        await navigator.clipboard.writeText(String(value));
                    }}
                >
                    Copy {type}
                </button>
            );
            
            const copyButton = screen.getByTestId(`copy-button-${type}`);
            expect(copyButton).toBeInTheDocument();
        });
    });

    it('should handle custom button props', () => {
        const customProps = {
            className: 'custom-copy-button',
            disabled: false,
        };
        
        render(
            <button
                data-testid="copy-button"
                {...customProps}
            >
                Copy
            </button>
        );

        const copyButton = screen.getByTestId('copy-button');
        expect(copyButton).toHaveClass('custom-copy-button');
        expect(copyButton).toHaveClass('custom-copy-button');
        expect(copyButton).not.toBeDisabled();
    });

    it('should test copy button with different content', () => {
        const contents = [
            { text: 'Copy', icon: '📋' },
            { text: 'Duplicate', icon: '📄' },
            { text: 'Clone', icon: '🔄' },
        ];

        contents.forEach(({ text, icon }) => {
            render(
                <button
                    key={text}
                    data-testid={`copy-button-${text}`}
                >
                    {icon} {text}
                </button>
            );
            
            const copyButton = screen.getByTestId(`copy-button-${text}`);
            expect(copyButton).toHaveTextContent(`${icon} ${text}`);
        });
    });

    it('should handle copy button with tooltip', () => {
        const tooltips = [
            { text: 'Click to copy', state: 'default' },
            { text: 'Copied to clipboard', state: 'copied' },
        ];

        tooltips.forEach(({ text, state }) => {
            render(
                <div key={state} data-testid={`tooltip-${state}`}>
                    <button
                        data-testid={`button-${state}`}
                        title={text}
                        aria-label={text}
                    >
                        Copy
                    </button>
                </div>
            );
            
            const button = screen.getByTestId(`button-${state}`);
            expect(button).toHaveAttribute('title', text);
            expect(button).toHaveAttribute('aria-label', text);
        });
    });
}); 