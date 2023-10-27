import type { TableSelectionContext } from 'roosterjs-content-model-core';
import type { InsertPoint } from '../../../publicTypes/selection/InsertPoint';
import type {
    ContentModelBlockGroup,
    ContentModelParagraph,
    ContentModelSelectionMarker,
} from 'roosterjs-content-model-types';

/**
 * @internal
 */
export function createInsertPoint(
    marker: ContentModelSelectionMarker,
    paragraph: ContentModelParagraph,
    path: ContentModelBlockGroup[],
    tableContext: TableSelectionContext | undefined
): InsertPoint {
    return {
        marker,
        paragraph,
        path,
        tableContext,
    };
}
