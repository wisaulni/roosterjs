import { isNodeOfType } from 'roosterjs-content-model-dom';
import type { DOMInsertPoint } from 'roosterjs-content-model-types';

/**
 * @internal
 *
 * Use with paths generated by `getPath`.
 */
export function getPositionFromPath(node: Node, path: number[]): DOMInsertPoint {
    // Iterate with a for loop to avoid mutating the passed in element path stack
    // or needing to copy it.
    let offset: number = 0;

    for (let i = 0; i < path.length; i++) {
        offset = path[i];

        if (
            i < path.length - 1 &&
            node &&
            isNodeOfType(node, 'ELEMENT_NODE') &&
            node.childNodes.length > offset
        ) {
            node = node.childNodes[offset];
        } else {
            break;
        }
    }

    return { node, offset };
}
