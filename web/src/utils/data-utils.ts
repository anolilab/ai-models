import type { Model } from "@anolilab/ai-model-registry";

import type { ModelTableRow } from "@/hooks/use-table";

const formatCost = (cost: number | null): string => {
    if (cost === null || cost === undefined)
        return "-";

    if (cost === 0)
        return "Free";

    if (cost < 0.001)
        return `$${(cost * 1000000).toFixed(2)}/1M tokens`;

    if (cost < 1)
        return `$${(cost * 1000).toFixed(2)}/1K tokens`;

    return `$${cost.toFixed(2)}/token`;
};

const formatBoolean = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined)
        return "-";

    return value ? "Yes" : "No";
};

const formatNumber = (value: number | null | undefined): string => {
    if (value === null || value === undefined)
        return "-";

    if (value === 0)
        return "-";

    return value.toLocaleString();
};

const formatModalities = (modalities: string[]): string => {
    if (!modalities || modalities.length === 0)
        return "-";

    return modalities.join(", ");
};

export const transformModelToTableRow = (model: Model, index: number): ModelTableRow => {
    return {
        cacheReadCost: formatCost(model.cost.inputCacheHit),
        cacheWriteCost: "-",
        contextLimit: model.limit.context ? formatNumber(model.limit.context) : "-",
        id: model.id,
        index,
        input: formatModalities(model.modalities.input),
        inputCost: formatCost(model.cost.input),
        knowledge: model.knowledge || "-",
        lastUpdated: model.lastUpdated || "-",
        model: (model.name || model.id).toLowerCase(),
        modelId: model.id,
        output: formatModalities(model.modalities.output),
        outputCost: formatCost(model.cost.output),
        outputLimit: model.limit.output ? formatNumber(model.limit.output) : "-",
        provider: model.provider || "Unknown",
        providerIcon: model.icon || null,
        providerId: model.providerId || "Unknown",
        reasoning: formatBoolean(model.reasoning),
        releaseDate: model.releaseDate || "-",
        temperature: formatBoolean(model.temperature),
        toolCall: formatBoolean(model.toolCall),
        weights: model.openWeights ? "Open" : "Closed",
    };
};

export const transformModelsToTableRows = (models: Model[]): ModelTableRow[] => models.map((model, index) => transformModelToTableRow(model, index)).sort((a, b) => a.provider.localeCompare(b.provider));

const createMemoizedTransformer = <T, R>(transformFn: (data: T) => R, getDependency: (data: T) => any) => {
    let lastDependency: any = null;
    let lastResult: R | null = null;

    return (data: T): R => {
        const dependency = getDependency(data);

        if (dependency === lastDependency && lastResult !== null) {
            return lastResult;
        }

        lastDependency = dependency;
        lastResult = transformFn(data);

        return lastResult;
    };
};

export const memoizedTransformModels = createMemoizedTransformer(transformModelsToTableRows, (models: Model[]) => models.length + models[0]?.id);
