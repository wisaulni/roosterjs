import { isCharacterValue, iterateSelections } from 'roosterjs-content-model-core';
import type {
    EditorPlugin,
    IStandaloneEditor,
    KeyDownEvent,
    PluginEvent,
} from 'roosterjs-content-model-types';
import {
    addDelimiters,
    isBlockElement,
    isEntityDelimiter,
    isEntityElement,
    isNodeOfType,
} from 'roosterjs-content-model-dom';

const DELIMITER_BEFORE = 'entityDelimiterBefore';
const DELIMITER_AFTER = 'entityDelimiterAfter';
const DELIMITER_SELECTOR = '.' + DELIMITER_AFTER + ',.' + DELIMITER_BEFORE;
const ZERO_WIDTH_SPACE = '\u200B';
const ENTITY_INFO_NAME = '_Entity';
const INLINE_ENTITY_SELECTOR = 'span.' + ENTITY_INFO_NAME;

/**
 * @internal
 * Entity delimiter plugin helps maintain delimiter elements around an entity so that user can put focus before/after an entity
 */
class EntityDelimiterPlugin implements EditorPlugin {
    private editor: IStandaloneEditor | null = null;

    /**
     *
     */
    constructor(private contentDiv: HTMLDivElement) {}

    /**
     * Get a friendly name of this plugin
     */
    getName() {
        return 'EntityDelimiter';
    }

    /**
     * The first method that editor will call to a plugin when editor is initializing.
     * It will pass in the editor instance, plugin should take this chance to save the
     * editor reference so that it can call to any editor method or format API later.
     * @param editor The editor object
     */
    initialize(editor: IStandaloneEditor) {
        this.editor = editor;
    }

    /**
     * The last method that editor will call to a plugin before it is disposed.
     * Plugin can take this chance to clear the reference to editor. After this method is
     * called, plugin should not call to any editor method since it will result in error.
     */
    dispose() {
        this.editor = null;
    }

    /**
     * Core method for a plugin. Once an event happens in editor, editor will call this
     * method of each plugin to handle the event as long as the event is not handled
     * exclusively by another plugin.
     * @param event The event to handle:
     */
    onPluginEvent(event: PluginEvent) {
        if (this.editor) {
            switch (event.eventType) {
                case 'contentChanged':
                case 'editorReady':
                    normalizeDelimitersInEditor(this.contentDiv);
                    break;

                case 'beforePaste':
                    const { fragment } = event;
                    addDelimitersIfNeeded(fragment.querySelectorAll(INLINE_ENTITY_SELECTOR));

                    break;

                case 'extractContentWithDom':
                case 'beforeCutCopy':
                    event.clonedRoot.querySelectorAll(DELIMITER_SELECTOR).forEach(node => {
                        if (isEntityDelimiter(node)) {
                            removeNode(node);
                        } else {
                            removeDelimiterAttr(node);
                        }
                    });
                    break;

                case 'keyDown':
                    handleKeyDownEvent(this.editor, event);
                    break;
            }
        }
    }
}

function preventTypeInDelimiter(delimiter: HTMLElement, editor?: IStandaloneEditor) {
    if (editor) {
        removeDelimiterAttr(delimiter, false);
        editor.formatContentModel(model => {
            iterateSelections(model, (_path, _, block, _segments) => {
                if (block?.blockType == 'Paragraph' && block.isImplicit) {
                    delete block.isImplicit;
                }
            });
            return true;
        });
    }
}

function normalizeDelimitersInEditor(root: HTMLElement) {
    removeInvalidDelimiters(root.querySelectorAll(DELIMITER_SELECTOR));
    addDelimitersIfNeeded(root.querySelectorAll(INLINE_ENTITY_SELECTOR));
}

function addDelimitersIfNeeded(nodes: Element[] | NodeListOf<Element>) {
    nodes.forEach(node => {
        if (
            isNodeOfType(node, 'ELEMENT_NODE') &&
            isEntityElement(node) &&
            !node.isContentEditable
        ) {
            addDelimiters(node.ownerDocument, node as HTMLElement);
        }
    });
}

function removeNode(el: Node | undefined | null) {
    el?.parentElement?.removeChild(el);
}

function removeInvalidDelimiters(nodes: Element[] | NodeListOf<Element>) {
    nodes.forEach(node => {
        if (isEntityDelimiter(node)) {
            const sibling = node.classList.contains(DELIMITER_BEFORE)
                ? node.nextElementSibling
                : node.previousElementSibling;
            if (!(isNodeOfType(sibling, 'ELEMENT_NODE') && isEntityElement(sibling))) {
                removeNode(node);
            }
        } else {
            removeDelimiterAttr(node);
        }
    });
}

function removeDelimiterAttr(node: Element | undefined | null, checkEntity: boolean = true) {
    if (!node) {
        return;
    }

    const isAfter = node.classList.contains(DELIMITER_AFTER);
    const entitySibling = isAfter ? node.previousElementSibling : node.nextElementSibling;
    if (checkEntity && entitySibling && isEntityElement(entitySibling)) {
        return;
    }

    node.classList.remove(DELIMITER_AFTER, DELIMITER_BEFORE);

    node.normalize();
    node.childNodes.forEach(cn => {
        const index = cn.textContent?.indexOf(ZERO_WIDTH_SPACE) ?? -1;
        if (index >= 0) {
            const range = new Range();
            range.setStart(cn, index);
            range.setEnd(cn, index + 1);
            range.deleteContents();
        }
    });
}

function handleCollapsedEnter(editor: IStandaloneEditor, delimiter: HTMLElement) {
    const isAfter = delimiter.classList.contains(DELIMITER_AFTER);
    const entity = !isAfter ? delimiter.nextSibling : delimiter.previousSibling;
    const block = getBlock(delimiter);

    requestAnimationFrame(editor, () => {
        if (!block) {
            return;
        }
        const blockToCheck = isAfter ? block.nextSibling : block.previousSibling;
        if (blockToCheck && isNodeOfType(blockToCheck, 'ELEMENT_NODE')) {
            const delimiters = blockToCheck.querySelectorAll(DELIMITER_SELECTOR);
            // Check if the last or first delimiter still contain the delimiter class and remove it.
            const delimiterToCheck = delimiters.item(isAfter ? 0 : delimiters.length - 1);
            removeDelimiterAttr(delimiterToCheck);
        }

        if (entity && isEntityElement(entity)) {
            const entityElement = entity as HTMLElement;
            const { nextElementSibling, previousElementSibling } = entityElement;
            [nextElementSibling, previousElementSibling].forEach(el => {
                // Check if after Enter the ZWS got removed but we still have a element with the class
                // Remove the attributes of the element if it is invalid now.
                if (
                    el &&
                    (el.className.indexOf(DELIMITER_BEFORE) > -1 ||
                        el.className.indexOf(DELIMITER_AFTER) > -1) &&
                    !isEntityDelimiter(el)
                ) {
                    removeDelimiterAttr(el, false /* checkEntity */);
                }
            });

            // Add delimiters to the entity if needed because on Enter we can sometimes lose the ZWS of the element.
            addDelimiters(entityElement.ownerDocument, entityElement);
        }
    });
}

function getBlock(node: Node | undefined) {
    if (!node) {
        return undefined;
    }

    while (node && (!isNodeOfType(node, 'ELEMENT_NODE') || !isBlockElement(node))) {
        node = node.parentElement || undefined;
    }

    return node;
}

function handleKeyDownEvent(editor: IStandaloneEditor, event: KeyDownEvent) {
    const selection = editor.getDOMSelection();
    const { rawEvent } = event;
    if (!selection || selection.type != 'range') {
        return;
    }

    if (selection.range.collapsed && (isCharacterValue(rawEvent) || rawEvent.key === 'Enter')) {
        const selection = editor.getDocument().getSelection();
        const node = selection?.focusNode;
        const element = node?.parentElement;
        if (!node || !element) {
            return;
        }

        const refNode = element == node ? element.childNodes.item(selection.focusOffset) : element;

        const delimiter = editor.getElementAtCursor(DELIMITER_SELECTOR, refNode);
        if (!delimiter) {
            return;
        }

        if (rawEvent.key === 'Enter') {
            handleCollapsedEnter(editor, delimiter);
        } else if (delimiter.firstChild?.nodeType == Node.TEXT_NODE) {
            requestAnimationFrame(editor, () => preventTypeInDelimiter(delimiter, editor));
        }
    }
}

/**
 * @internal
 * Create a new instance of EntityDelimiterPlugin.
 */
export function createEntityDelimiterPlugin(contentDiv: HTMLDivElement): EditorPlugin {
    return new EntityDelimiterPlugin(contentDiv);
}

function requestAnimationFrame(editor: IStandaloneEditor, callback: FrameRequestCallback) {
    const window = editor.getDocument().defaultView;
    if (window) {
        window.requestAnimationFrame(callback);
    }
}
