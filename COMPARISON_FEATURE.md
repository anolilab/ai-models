# Model Comparison Feature

## Overview

The web app now includes a powerful model comparison feature that allows users to select up to 5 AI models and compare them side-by-side in a comprehensive dialog.

## Features

### 1. Configurable Selection Limit
- **Default Limit**: 5 models maximum for comparison
- **Configurable**: The limit can be adjusted via the `maxSelectionLimit` configuration option
- **Visual Feedback**: Users see a "(max 5 for comparison)" indicator when multiple models are selected

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

1. **Select Models**: Use the checkboxes to select 2-5 models for comparison
2. **Compare Button**: Click "Compare Models" button that appears when multiple models are selected
3. **Review Comparison**: The dialog opens showing:
   - Quick summary of best values
   - Detailed side-by-side comparison
   - Highlighted differences and best values
4. **Close**: Click "Close" to return to the main table

## Technical Implementation

### Configuration
```typescript
// In DataTable config
{
  maxSelectionLimit: 5, // Configurable limit
  enableRowSelection: true,
  // ... other config options
}
```

### Components
- `ModelComparisonDialog`: Main comparison dialog component
- Enhanced `DataTable`: Updated with selection limit logic
- Updated toolbar with comparison button

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
5. **Efficient Workflow**: Streamlined comparison process with configurable limits

## Future Enhancements

Potential improvements could include:
- Export comparison results
- Custom comparison fields
- Side-by-side performance metrics
- User-defined comparison criteria
- Comparison history/saved comparisons