import type { ContentModelParagraph } from '../contentModel/block/ContentModelParagraph';
import type { ContentModelSelectionMarker } from '../contentModel/segment/ContentModelSelectionMarker';
import type { ReadonlyContentModelBlockGroup } from '../contentModel/blockGroup/ContentModelBlockGroup';
import type { ReadonlyTableSelectionContext } from './TableSelectionContext';

/**
 * Represent all related information of an insert point
 */
export interface InsertPoint {
    /**
     * The selection marker object for this insert point
     */
    marker: ContentModelSelectionMarker;

    /**
     * The paragraph that contains this insert point
     */
    paragraph: ContentModelParagraph;

    /**
     * Block group path of this insert point, from direct parent group to the root group
     */
    path: ReadonlyContentModelBlockGroup[];

    /**
     * Table context of this insert point
     */
    tableContext?: ReadonlyTableSelectionContext;
}
