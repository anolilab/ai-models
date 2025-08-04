# Model Comparison Feature

## Overview

The web app now includes a powerful model comparison feature that allows users to select up to 5 AI models and compare them side-by-side in a comprehensive dialog.

## Features

### 1. Dual Mode Selection System
- **Comparison Mode**: Limited to 5 models maximum for side-by-side comparison
- **Export Mode**: Unlimited selection for data export functionality
- **Mode Toggle**: Easy switching between modes with visual indicators
- **Smart Clearing**: Selections are cleared when switching modes to avoid confusion

### 2. Comparison Dialog
- **Side-by-Side View**: Models are displayed in columns for easy comparison
- **Comprehensive Fields**: Compares all major model attributes including:
  - Provider and model information
  - Input/Output modalities
  - Cost information (input, output, cache)
  - Context and output limits
  - Capabilities (temperature, tool call, reasoning)
  - Metadata (release date, last updated, weights, knowledge)

### 3. Visual Comparison Features
- **Difference Highlighting**: Fields with different values across models are highlighted in yellow
- **Best Value Indicators**: The best value for each field is highlighted in green with a "Best" badge
- **Quick Summary**: Shows the best values for key metrics (lowest costs, highest limits)
- **Provider Icons**: Visual provider identification with fallback text

### 4. Smart Value Analysis
- **Cost Optimization**: Automatically identifies the lowest cost options
- **Limit Comparison**: Highlights models with the highest context/output limits
- **Boolean Features**: Clear visual indicators for capabilities (✓/✗)

## Usage

### Comparison Mode
1. **Switch to Compare Mode**: Click the "Compare" button in the toolbar
2. **Select Models**: Use the checkboxes to select 2-5 models for comparison
3. **Compare Button**: Click "Compare Models" button that appears when multiple models are selected
4. **Review Comparison**: The dialog opens showing:
   - Quick summary of best values
   - Detailed side-by-side comparison
   - Highlighted differences and best values
5. **Close**: Click "Close" to return to the main table

### Export Mode
1. **Switch to Export Mode**: Click the "Export" button in the toolbar
2. **Select Models**: Use the checkboxes to select any number of models for export
3. **Export Data**: Use the existing export functionality to download selected models
4. **Unlimited Selection**: No restrictions on the number of models you can select

## Technical Implementation

### Configuration
```typescript
// In DataTable config
{
  maxSelectionLimit: 5, // Limit for comparison mode
  selectionMode: "comparison" | "export", // Current mode
  enableRowSelection: true,
  // ... other config options
}
```

### Components
- `ModelComparisonDialog`: Main comparison dialog component
- `SelectionModeToggle`: Mode switching component for toolbar
- Enhanced `DataTable`: Updated with dual-mode selection logic
- Updated toolbar with mode toggle and conditional actions

### Key Features
- **Responsive Design**: Works on desktop and mobile
- **Performance Optimized**: Efficient rendering for large datasets
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Type Safety**: Full TypeScript support

## Benefits

1. **Informed Decisions**: Users can easily compare models across multiple dimensions
2. **Cost Optimization**: Quickly identify the most cost-effective options
3. **Capability Assessment**: Compare features like tool calling, reasoning, etc.
4. **Visual Clarity**: Clear highlighting makes differences obvious
5. **Efficient Workflow**: Streamlined comparison process with dual-mode system
6. **Export Compatibility**: Maintains full export functionality without restrictions
7. **Mode Flexibility**: Easy switching between comparison and export workflows

## Future Enhancements

Potential improvements could include:
- Export comparison results
- Custom comparison fields
- Side-by-side performance metrics
- User-defined comparison criteria
- Comparison history/saved comparisons