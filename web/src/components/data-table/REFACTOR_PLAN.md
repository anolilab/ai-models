# Data Table Refactor Plan

## Overview

This plan outlines the complete refactoring of the data-table components from Mantine to Shadcn/Tailwind, including:

1. Removing MRT\_ prefix from all files
2. Converting to kebab-case naming
3. Migrating from Mantine to Shadcn components
4. Converting CSS modules to inline styles/classes

## Phase 1: File Renaming and Structure Setup

### 1.1 Remove MRT\_ prefix and convert to kebab-case

**Status: PENDING**

#### Components/Body

- [ ] `MRT_TableBodyCell.module.css` → `table-body-cell.module.css`
- [ ] `MRT_TableBodyCell.tsx` → `table-body-cell.tsx`
- [ ] `MRT_TableBodyCellValue.tsx` → `table-body-cell-value.tsx`
- [ ] `MRT_TableBodyEmptyRow.tsx` → `table-body-empty-row.tsx`
- [ ] `MRT_TableBody.module.css` → `table-body.module.css`
- [ ] `MRT_TableBodyRowGrabHandle.tsx` → `table-body-row-grab-handle.tsx`
- [ ] `MRT_TableBodyRow.module.css` → `table-body-row.module.css`
- [ ] `MRT_TableBodyRowPinButton.tsx` → `table-body-row-pin-button.tsx`
- [ ] `MRT_TableBodyRow.tsx` → `table-body-row.tsx`
- [ ] `MRT_TableBody.tsx` → `table-body.tsx`
- [ ] `MRT_TableDetailPanel.module.css` → `table-detail-panel.module.css`
- [ ] `MRT_TableDetailPanel.tsx` → `table-detail-panel.tsx`

#### Components/Buttons

- [ ] `MRT_ColumnPinningButtons.module.css` → `column-pinning-buttons.module.css`
- [ ] `MRT_ColumnPinningButtons.tsx` → `column-pinning-buttons.tsx`
- [ ] `MRT_CopyButton.module.css` → `copy-button.module.css`
- [ ] `MRT_CopyButton.tsx` → `copy-button.tsx`
- [ ] `MRT_EditActionButtons.module.css` → `edit-action-buttons.module.css`
- [ ] `MRT_EditActionButtons.tsx` → `edit-action-buttons.tsx`
- [ ] `MRT_ExpandAllButton.module.css` → `expand-all-button.module.css`
- [ ] `MRT_ExpandAllButton.tsx` → `expand-all-button.tsx`
- [ ] `MRT_ExpandButton.module.css` → `expand-button.module.css`
- [ ] `MRT_ExpandButton.tsx` → `expand-button.tsx`
- [ ] `MRT_GrabHandleButton.module.css` → `grab-handle-button.module.css`
- [ ] `MRT_GrabHandleButton.tsx` → `grab-handle-button.tsx`
- [ ] `MRT_RowPinButton.tsx` → `row-pin-button.tsx`
- [ ] `MRT_ShowHideColumnsButton.tsx` → `show-hide-columns-button.tsx`
- [ ] `MRT_ToggleDensePaddingButton.tsx` → `toggle-dense-padding-button.tsx`
- [ ] `MRT_ToggleFiltersButton.tsx` → `toggle-filters-button.tsx`
- [ ] `MRT_ToggleFullScreenButton.tsx` → `toggle-full-screen-button.tsx`
- [ ] `MRT_ToggleGlobalFilterButton.tsx` → `toggle-global-filter-button.tsx`
- [ ] `MRT_ToggleRowActionMenuButton.tsx` → `toggle-row-action-menu-button.tsx`

#### Components/Footer

- [ ] `MRT_TableFooterCell.module.css` → `table-footer-cell.module.css`
- [ ] `MRT_TableFooterCell.tsx` → `table-footer-cell.tsx`
- [ ] `MRT_TableFooter.module.css` → `table-footer.module.css`
- [ ] `MRT_TableFooterRow.module.css` → `table-footer-row.module.css`
- [ ] `MRT_TableFooterRow.tsx` → `table-footer-row.tsx`
- [ ] `MRT_TableFooter.tsx` → `table-footer.tsx`

#### Components/Head

- [ ] `MRT_TableHeadCellFilterContainer.module.css` → `table-head-cell-filter-container.module.css`
- [ ] `MRT_TableHeadCellFilterContainer.tsx` → `table-head-cell-filter-container.tsx`
- [ ] `MRT_TableHeadCellFilterLabel.module.css` → `table-head-cell-filter-label.module.css`
- [ ] `MRT_TableHeadCellFilterLabel.tsx` → `table-head-cell-filter-label.tsx`
- [ ] `MRT_TableHeadCellGrabHandle.tsx` → `table-head-cell-grab-handle.tsx`
- [ ] `MRT_TableHeadCell.module.css` → `table-head-cell.module.css`
- [ ] `MRT_TableHeadCellResizeHandle.module.css` → `table-head-cell-resize-handle.module.css`
- [ ] `MRT_TableHeadCellResizeHandle.tsx` → `table-head-cell-resize-handle.tsx`
- [ ] `MRT_TableHeadCellSortLabel.module.css` → `table-head-cell-sort-label.module.css`
- [ ] `MRT_TableHeadCellSortLabel.tsx` → `table-head-cell-sort-label.tsx`
- [ ] `MRT_TableHeadCell.tsx` → `table-head-cell.tsx`
- [ ] `MRT_TableHead.module.css` → `table-head.module.css`
- [ ] `MRT_TableHeadRow.module.css` → `table-head-row.module.css`
- [ ] `MRT_TableHeadRow.tsx` → `table-head-row.tsx`
- [ ] `MRT_TableHead.tsx` → `table-head.tsx`

#### Components/Inputs

- [ ] `MRT_EditCellTextInput.tsx` → `edit-cell-text-input.tsx`
- [ ] `MRT_FilterCheckBox.module.css` → `filter-checkbox.module.css`
- [ ] `MRT_FilterCheckbox.tsx` → `filter-checkbox.tsx`
- [ ] `MRT_FilterRangeFields.module.css` → `filter-range-fields.module.css`
- [ ] `MRT_FilterRangeFields.tsx` → `filter-range-fields.tsx`
- [ ] `MRT_FilterRangeSlider.module.css` → `filter-range-slider.module.css`
- [ ] `MRT_FilterRangeSlider.tsx` → `filter-range-slider.tsx`
- [ ] `MRT_FilterTextInput.module.css` → `filter-text-input.module.css`
- [ ] `MRT_FilterTextInput.tsx` → `filter-text-input.tsx`
- [ ] `MRT_GlobalFilterTextInput.module.css` → `global-filter-text-input.module.css`
- [ ] `MRT_GlobalFilterTextInput.tsx` → `global-filter-text-input.tsx`
- [ ] `MRT_SelectCheckbox.tsx` → `select-checkbox.tsx`

#### Components/Menus

- [ ] `MRT_ColumnActionMenu.module.css` → `column-action-menu.module.css`
- [ ] `MRT_ColumnActionMenu.tsx` → `column-action-menu.tsx`
- [ ] `MRT_FilterOptionMenu.module.css` → `filter-option-menu.module.css`
- [ ] `MRT_FilterOptionMenu.tsx` → `filter-option-menu.tsx`
- [ ] `MRT_RowActionMenu.tsx` → `row-action-menu.tsx`
- [ ] `MRT_ShowHideColumnsMenuItems.module.css` → `show-hide-columns-menu-items.module.css`
- [ ] `MRT_ShowHideColumnsMenuItems.tsx` → `show-hide-columns-menu-items.tsx`
- [ ] `MRT_ShowHideColumnsMenu.module.css` → `show-hide-columns-menu.module.css`
- [ ] `MRT_ShowHideColumnsMenu.tsx` → `show-hide-columns-menu.tsx`

#### Components/Modals

- [ ] `MRT_EditRowModal.tsx` → `edit-row-modal.tsx`

#### Components/Table

- [ ] `MRT_TableContainer.module.css` → `table-container.module.css`
- [ ] `MRT_TableContainer.tsx` → `table-container.tsx`
- [ ] `MRT_Table.module.css` → `table.module.css`
- [ ] `MRT_TablePaper.module.css` → `table-paper.module.css`
- [ ] `MRT_TablePaper.tsx` → `table-paper.tsx`
- [ ] `MRT_Table.tsx` → `table.tsx`

#### Components/Toolbar

- [ ] `common.styles.module.css` → `common-styles.module.css`
- [ ] `MRT_BottomToolbar.module.css` → `bottom-toolbar.module.css`
- [ ] `MRT_BottomToolbar.tsx` → `bottom-toolbar.tsx`
- [ ] `MRT_ProgressBar.module.css` → `progress-bar.module.css`
- [ ] `MRT_ProgressBar.tsx` → `progress-bar.tsx`
- [ ] `MRT_TablePagination.module.css` → `table-pagination.module.css`
- [ ] `MRT_TablePagination.tsx` → `table-pagination.tsx`
- [ ] `MRT_ToolbarAlertBanner.module.css` → `toolbar-alert-banner.module.css`
- [ ] `MRT_ToolbarAlertBanner.tsx` → `toolbar-alert-banner.tsx`
- [ ] `MRT_ToolbarDropZone.module.css` → `toolbar-drop-zone.module.css`
- [ ] `MRT_ToolbarDropZone.tsx` → `toolbar-drop-zone.tsx`
- [ ] `MRT_ToolbarInternalButtons.module.css` → `toolbar-internal-buttons.module.css`
- [ ] `MRT_ToolbarInternalButtons.tsx` → `toolbar-internal-buttons.tsx`
- [ ] `MRT_TopToolbar.module.css` → `top-toolbar.module.css`
- [ ] `MRT_TopToolbar.tsx` → `top-toolbar.tsx`

#### Hooks

- [ ] `getMRT_RowActionsColumnDef.tsx` → `get-row-actions-column-def.tsx`
- [ ] `getMRT_RowDragColumnDef.tsx` → `get-row-drag-column-def.tsx`
- [ ] `getMRT_RowExpandColumnDef.tsx` → `get-row-expand-column-def.tsx`
- [ ] `getMRT_RowNumbersColumnDef.tsx` → `get-row-numbers-column-def.tsx`
- [ ] `getMRT_RowPinningColumnDef.tsx` → `get-row-pinning-column-def.tsx`
- [ ] `getMRT_RowSelectColumnDef.tsx` → `get-row-select-column-def.tsx`
- [ ] `getMRT_RowSpacerColumnDef.tsx` → `get-row-spacer-column-def.tsx`
- [ ] `useMaterialReactTable.ts` → `use-material-react-table.ts`
- [ ] `useMRT_ColumnVirtualizer.ts` → `use-column-virtualizer.ts`
- [ ] `useMRT_Effects.ts` → `use-effects.ts`
- [ ] `useMRT_Rows.ts` → `use-rows.ts`
- [ ] `useMRT_RowVirtualizer.ts` → `use-row-virtualizer.ts`
- [ ] `useMRT_TableInstance.ts` → `use-table-instance.ts`
- [ ] `useMRT_TableOptions.ts` → `use-table-options.ts`

#### Utils

- [ ] `cell.utils.ts` → `cell-utils.ts`
- [ ] `column.utils.ts` → `column-utils.ts`
- [ ] `displayColumn.utils.ts` → `display-column-utils.ts`
- [ ] `row-utils.ts` → `row-utils.ts`
- [ ] `style.utils.ts` → `style-utils.ts`
- [ ] `tanstack.helpers.ts` → `tanstack-helpers.ts`
- [ ] `utils.ts` → `utils.ts` (no change needed)
- [ ] `virtualization.utils.ts` → `virtualization-utils.ts`

#### Root Files

- [ ] `MantineReactTable.tsx` → `material-react-table.tsx`
- [ ] `data-table-action-bar.tsx` → `data-table-action-bar.tsx` (no change needed)

### 1.2 Update all import statements

**Status: PENDING**

- [ ] Update all import paths to reflect new file names
- [ ] Update all component references to remove MRT\_ prefix
- [ ] Update all hook references to remove MRT\_ prefix

## Phase 2: Mantine to Shadcn Migration

### 2.1 Core Components Migration

**Status: PENDING**

#### Table Components

- [ ] `table.tsx` - Migrate from Mantine Table to Shadcn Table
- [ ] `table-body.tsx` - Migrate from Mantine TableTbody to Shadcn TableBody
- [ ] `table-body-cell.tsx` - Migrate from Mantine TableTd to Shadcn TableCell
- [ ] `table-body-row.tsx` - Migrate from Mantine TableTr to Shadcn TableRow
- [ ] `table-head.tsx` - Migrate from Mantine TableThead to Shadcn TableHead
- [ ] `table-head-cell.tsx` - Migrate from Mantine TableTh to Shadcn TableHead
- [ ] `table-footer.tsx` - Migrate from Mantine TableTfoot to Shadcn TableFooter

#### Button Components

- [ ] `copy-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `edit-action-buttons.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `expand-all-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `expand-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `grab-handle-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `row-pin-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `show-hide-columns-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `toggle-dense-padding-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `toggle-filters-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `toggle-full-screen-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `toggle-global-filter-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `toggle-row-action-menu-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button

#### Input Components

- [ ] `edit-cell-text-input.tsx` - Migrate from Mantine TextInput to Shadcn Input
- [ ] `filter-checkbox.tsx` - Migrate from Mantine Checkbox to Shadcn Checkbox
- [ ] `filter-range-fields.tsx` - Migrate from Mantine NumberInput to Shadcn Input
- [ ] `filter-range-slider.tsx` - Migrate from Mantine RangeSlider to Shadcn Slider
- [ ] `filter-text-input.tsx` - Migrate from Mantine TextInput to Shadcn Input
- [ ] `global-filter-text-input.tsx` - Migrate from Mantine TextInput to Shadcn Input
- [ ] `select-checkbox.tsx` - Migrate from Mantine Checkbox to Shadcn Checkbox

#### Menu Components

- [ ] `column-action-menu.tsx` - Migrate from Mantine Menu to Shadcn DropdownMenu
- [ ] `filter-option-menu.tsx` - Migrate from Mantine Menu to Shadcn DropdownMenu
- [ ] `row-action-menu.tsx` - Migrate from Mantine Menu to Shadcn DropdownMenu
- [ ] `show-hide-columns-menu.tsx` - Migrate from Mantine Menu to Shadcn DropdownMenu
- [ ] `show-hide-columns-menu-items.tsx` - Migrate from Mantine Menu to Shadcn DropdownMenu

#### Modal Components

- [ ] `edit-row-modal.tsx` - Migrate from Mantine Modal to Shadcn Dialog

#### Toolbar Components

- [ ] `bottom-toolbar.tsx` - Migrate from Mantine Box to Shadcn div with Tailwind
- [ ] `top-toolbar.tsx` - Migrate from Mantine Box to Shadcn div with Tailwind
- [ ] `toolbar-alert-banner.tsx` - Migrate from Mantine Alert to Shadcn Alert
- [ ] `toolbar-drop-zone.tsx` - Migrate from Mantine Box to Shadcn div with Tailwind
- [ ] `toolbar-internal-buttons.tsx` - Migrate from Mantine Box to Shadcn div with Tailwind
- [ ] `table-pagination.tsx` - Migrate from Mantine Pagination to Shadcn Pagination
- [ ] `progress-bar.tsx` - Migrate from Mantine Progress to Shadcn Progress

#### Container Components

- [ ] `table-container.tsx` - Migrate from Mantine Box to Shadcn div with Tailwind
- [ ] `table-paper.tsx` - Migrate from Mantine Paper to Shadcn Card

### 2.2 Utility Components Migration

**Status: PENDING**

- [ ] `column-pinning-buttons.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `table-body-cell-value.tsx` - Migrate from Mantine components to Shadcn
- [ ] `table-body-empty-row.tsx` - Migrate from Mantine TableTr to Shadcn TableRow
- [ ] `table-body-row-grab-handle.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `table-body-row-pin-button.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `table-detail-panel.tsx` - Migrate from Mantine TableTd to Shadcn TableCell
- [ ] `table-footer-cell.tsx` - Migrate from Mantine TableTh to Shadcn TableHead
- [ ] `table-footer-row.tsx` - Migrate from Mantine TableTr to Shadcn TableRow
- [ ] `table-head-cell-filter-container.tsx` - Migrate from Mantine Flex to Shadcn div
- [ ] `table-head-cell-filter-label.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `table-head-cell-grab-handle.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `table-head-cell-resize-handle.tsx` - Migrate from Mantine Box to Shadcn div
- [ ] `table-head-cell-sort-label.tsx` - Migrate from Mantine ActionIcon to Shadcn Button
- [ ] `table-head-row.tsx` - Migrate from Mantine TableTr to Shadcn TableRow

## Phase 3: CSS Migration

### 3.1 Convert CSS Modules to Tailwind Classes

**Status: PENDING**

#### Body Components

- [ ] `table-body-cell.module.css` → Convert to Tailwind classes
- [ ] `table-body.module.css` → Convert to Tailwind classes
- [ ] `table-body-row.module.css` → Convert to Tailwind classes
- [ ] `table-detail-panel.module.css` → Convert to Tailwind classes

#### Button Components

- [ ] `column-pinning-buttons.module.css` → Convert to Tailwind classes
- [ ] `copy-button.module.css` → Convert to Tailwind classes
- [ ] `edit-action-buttons.module.css` → Convert to Tailwind classes
- [ ] `expand-all-button.module.css` → Convert to Tailwind classes
- [ ] `expand-button.module.css` → Convert to Tailwind classes
- [ ] `grab-handle-button.module.css` → Convert to Tailwind classes

#### Footer Components

- [ ] `table-footer-cell.module.css` → Convert to Tailwind classes
- [ ] `table-footer.module.css` → Convert to Tailwind classes
- [ ] `table-footer-row.module.css` → Convert to Tailwind classes

#### Head Components

- [ ] `table-head-cell-filter-container.module.css` → Convert to Tailwind classes
- [ ] `table-head-cell-filter-label.module.css` → Convert to Tailwind classes
- [ ] `table-head-cell.module.css` → Convert to Tailwind classes
- [ ] `table-head-cell-resize-handle.module.css` → Convert to Tailwind classes
- [ ] `table-head-cell-sort-label.module.css` → Convert to Tailwind classes
- [ ] `table-head.module.css` → Convert to Tailwind classes
- [ ] `table-head-row.module.css` → Convert to Tailwind classes

#### Input Components

- [ ] `filter-checkbox.module.css` → Convert to Tailwind classes
- [ ] `filter-range-fields.module.css` → Convert to Tailwind classes
- [ ] `filter-range-slider.module.css` → Convert to Tailwind classes
- [ ] `filter-text-input.module.css` → Convert to Tailwind classes
- [ ] `global-filter-text-input.module.css` → Convert to Tailwind classes

#### Menu Components

- [ ] `column-action-menu.module.css` → Convert to Tailwind classes
- [ ] `filter-option-menu.module.css` → Convert to Tailwind classes
- [ ] `show-hide-columns-menu-items.module.css` → Convert to Tailwind classes
- [ ] `show-hide-columns-menu.module.css` → Convert to Tailwind classes

#### Table Components

- [ ] `table-container.module.css` → Convert to Tailwind classes
- [ ] `table.module.css` → Convert to Tailwind classes
- [ ] `table-paper.module.css` → Convert to Tailwind classes

#### Toolbar Components

- [ ] `common-styles.module.css` → Convert to Tailwind classes
- [ ] `bottom-toolbar.module.css` → Convert to Tailwind classes
- [ ] `progress-bar.module.css` → Convert to Tailwind classes
- [ ] `table-pagination.module.css` → Convert to Tailwind classes
- [ ] `toolbar-alert-banner.module.css` → Convert to Tailwind classes
- [ ] `toolbar-drop-zone.module.css` → Convert to Tailwind classes
- [ ] `toolbar-internal-buttons.module.css` → Convert to Tailwind classes
- [ ] `top-toolbar.module.css` → Convert to Tailwind classes

### 3.2 Remove CSS Module Files

**Status: PENDING**

- [ ] Delete all .module.css files after conversion
- [ ] Update import statements to remove CSS module imports
- [ ] Verify no CSS module references remain

## Phase 4: Type Updates and Cleanup

### 4.1 Update Type Definitions

**Status: PENDING**

- [ ] Update all MRT\_ prefixed types to remove prefix
- [ ] Update all interface names to remove MRT\_ prefix
- [ ] Update all type imports and exports
- [ ] Update all component prop interfaces

### 4.2 Update Hook Names and References

**Status: PENDING**

- [ ] Update all hook names to remove MRT\_ prefix
- [ ] Update all hook imports and exports
- [ ] Update all hook usage throughout components

### 4.3 Update Utility Functions

**Status: PENDING**

- [ ] Update all utility function names to remove MRT\_ prefix
- [ ] Update all utility imports and exports
- [ ] Update all utility usage throughout components

## Phase 5: Testing and Validation

### 5.1 Component Testing

**Status: PENDING**

- [ ] Test all migrated components for functionality
- [ ] Verify all props and interfaces work correctly
- [ ] Test all event handlers and callbacks
- [ ] Verify all styling and layout

### 5.2 Integration Testing

**Status: PENDING**

- [ ] Test complete table functionality
- [ ] Test all table features (sorting, filtering, pagination, etc.)
- [ ] Test responsive behavior
- [ ] Test accessibility features

### 5.3 Performance Testing

**Status: PENDING**

- [ ] Test table performance with large datasets
- [ ] Test virtualization features
- [ ] Test memory usage
- [ ] Test rendering performance

## Phase 6: Documentation and Cleanup

### 6.1 Update Documentation

**Status: PENDING**

- [ ] Update README files
- [ ] Update component documentation
- [ ] Update usage examples
- [ ] Update API documentation

### 6.2 Final Cleanup

**Status: PENDING**

- [ ] Remove any remaining Mantine dependencies
- [ ] Clean up unused imports
- [ ] Remove any remaining CSS module references
- [ ] Update package.json if needed

## Checkpoints

### Checkpoint 1: File Renaming Complete

- [ ] All files renamed to kebab-case
- [ ] All MRT\_ prefixes removed
- [ ] All import statements updated
- [ ] All component references updated

### Checkpoint 2: Core Migration Complete

- [ ] All table components migrated to Shadcn
- [ ] All button components migrated to Shadcn
- [ ] All input components migrated to Shadcn
- [ ] All menu components migrated to Shadcn

### Checkpoint 3: CSS Migration Complete

- [ ] All CSS modules converted to Tailwind
- [ ] All .module.css files removed
- [ ] All styling working correctly
- [ ] No CSS module imports remaining

### Checkpoint 4: Type System Updated

- [ ] All types updated to remove MRT\_ prefix
- [ ] All interfaces updated
- [ ] All imports/exports updated
- [ ] TypeScript compilation successful

### Checkpoint 5: Testing Complete

- [ ] All components tested
- [ ] All features working
- [ ] Performance acceptable
- [ ] No regressions found

## Notes

- Each phase should be completed before moving to the next
- After each checkpoint, verify the application still works
- Keep backups of original files until migration is complete
- Test thoroughly after each major change
- Update this plan as progress is made
