import { internalConvertToMutableType } from './internalConvertToMutableType';
import type {
    ContentModelGeneralSegment,
    ReadonlyContentModelGeneralSegment,
    ReadonlyContentModelSegmentFormat,
} from 'roosterjs-content-model-types';

/**
 * Create a ContentModelGeneralSegment model
 * @param element The original DOM element
 * @param format @optional The format of this model
 */
export function createGeneralSegment(
    element: HTMLElement,
    format?: ReadonlyContentModelSegmentFormat
): ContentModelGeneralSegment {
    let result: ReadonlyContentModelGeneralSegment = {
        blockType: 'BlockGroup',
        blockGroupType: 'General',
        segmentType: 'General',
        format: { ...format },
        blocks: [],
        element: element,
    };

    return internalConvertToMutableType(result);
}
