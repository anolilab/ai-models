# Active Context

## Current Focus
**Selection Mode Toggle Feature**: ✅ Completed
- **Provider Registry Package v1.1.0**: Ready for publication with enhanced selection capabilities
- **Web Application**: Successfully integrated with selection mode toggle and comprehensive testing

## Recent Achievements
- **Selection Mode Toggle Feature**: ✅ Completed
  - Added `SelectionModeToggle` component with visual indicators
  - Implemented dual-mode selection: "Compare" (10 items max) and "Export" (unlimited)
  - Fixed selection limit logic to only apply in comparison mode
  - Added mode-aware toolbar actions and validation messages
- **Select All Checkbox Fix**: ✅ Completed
  - Fixed `createColumnsWithSelection` to properly handle selection mode for all column sources
  - Ensured select all checkbox is disabled in comparison mode regardless of column source
  - Maintained individual row selection functionality in both modes
- **Selection Mode Reactivity Fix**: ✅ Completed
  - Fixed `useModelTable` hook's `columns` useMemo dependency array
  - Now properly watches `options.selectionMode` changes instead of just the `options` object
  - Ensures columns are recreated when selection mode changes, updating checkbox state
- **Icon System Fixes**:
  - **Weights & Biases Icon Mapping**: Fixed icon mapping for "Weights & Biases" provider
  - **Custom Icon Integration**: Successfully integrated custom `wandb.svg` icon
  - **Multiple Provider Name Support**: Added mappings for "wandb", "weights & biases", "Weights & Biases", and "weights-biases"
  - **Icon Generation Script**: Updated to handle special case for Weights & Biases custom icon
- **Web Application**:
  - **Playwright Configuration**: Fixed build script reference in playwright config
  - **E2E Testing**: Ready for end-to-end testing with corrected configuration
  - **Provider Registry Integration**: Successfully integrated with the npm package

## Next Steps
- **Package Publication**: Ready to publish provider registry package to npm
- **Testing**: Verify selection mode toggle functionality in browser
- **Web Application Testing**: Run E2E tests to ensure web application works correctly
- **Documentation**: Update user documentation for new selection modes
- **Performance**: Monitor table performance with new selection logic

## Active Decisions and Considerations
- **Selection Mode Architecture**: Using centralized selection mode state with proper propagation
- **Column Creation Strategy**: Ensuring all column creation paths respect selection mode
- **User Experience**: Clear visual indicators and tooltips for mode switching
- **React Optimization**: Using specific dependency arrays in useMemo for better performance
- **Backward Compatibility**: Maintaining existing functionality while adding new features 