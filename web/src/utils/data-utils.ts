import type { Model } from "@anolilab/ai-model-registry";

import type { ModelTableRow } from "@/hooks/use-table";
import { formatModelCost } from "@/utils/format";

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

const transformModelToTableRow = (model: Model, index: number): ModelTableRow => {
    return {
        cacheReadCost: formatModelCost(model.cost.inputCacheHit),
        cacheWriteCost: "-",
        contextLimit: model.limit.context ? formatNumber(model.limit.context) : "-",
        id: model.id,
        index,
        input: formatModalities(model.modalities.input),
        inputCost: formatModelCost(model.cost.input),
        knowledge: model.knowledge || "-",
        lastUpdated: model.lastUpdated || "-",
        model: (model.name || model.id).toLowerCase(),
        modelId: model.id,
        output: formatModalities(model.modalities.output),
        outputCost: formatModelCost(model.cost.output),
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

const transformModelsToTableRows = (models: Model[]): ModelTableRow[] =>
    models.map((model, index) => transformModelToTableRow(model, index)).sort((a, b) => a.provider.localeCompare(b.provider));

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

export { transformModelToTableRow, transformModelsToTableRows };
export const memoizedTransformModels = createMemoizedTransformer(transformModelsToTableRows, (models: Model[]) => models.length + (models[0]?.id ?? ""));
