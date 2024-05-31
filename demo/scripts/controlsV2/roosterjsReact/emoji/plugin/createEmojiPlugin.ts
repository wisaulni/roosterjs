import * as React from 'react';
import {
    isModifierKey,
    isNodeOfType,
    iterateSelections,
    mutateSegment,
} from 'roosterjs-content-model-dom';
import { KeyCodes } from '@fluentui/react/lib/Utilities';
import { MoreEmoji } from '../utils/emojiList';
import { showEmojiCallout } from '../components/showEmojiCallout';
import { undo } from 'roosterjs-content-model-core';
import type { EmojiICallout } from '../components/showEmojiCallout';
import type { Emoji } from '../type/Emoji';
import type { EmojiPane } from '../components/EmojiPane';
import type { EmojiStringKeys } from '../type/EmojiStringKeys';
import type { LocalizedStrings, ReactEditorPlugin, UIUtilities } from '../../common/index';
import {
    EmojiDescriptionStrings,
    EmojiFamilyStrings,
    EmojiKeywordStrings,
} from '../type/EmojiStrings';
import type { IEditor, KeyDownEvent, KeyUpEvent, PluginEvent } from 'roosterjs-content-model-types';

const KEYCODE_COLON = 186;
const KEYCODE_COLON_FIREFOX = 59;

// Regex looks for an emoji right before the : to allow contextual search immediately following an emoji
// MATCHES: 0: 😃:r
//          1: 😃
//          2: :r
const EMOJI_BEFORE_COLON_REGEX = /([\u0023-\u0039][\u20e3]|[\ud800-\udbff][\udc00-\udfff]|[\u00a9-\u00ae]|[\u2122-\u3299])*([:;][^:]*)/;

// White space matching regex. It matches following chars:
// \s: white space
// \u00A0: no-breaking white space
// \u200B: zero width space
// \u3000: full width space (which can come from JPN IME)
const WHITESPACE_REGEX = /[\s\u00A0\u200B\u3000]+([^\s\u00A0\u200B\u3000]*)$/i;

class EmojiPlugin implements ReactEditorPlugin {
    private editor: IEditor | null = null;
    private eventHandledOnKeyDown: boolean = false;
    private canUndoEmoji: boolean = false;
    private isSuggesting: boolean = false;
    private paneRef = React.createRef<EmojiPane>();
    private timer: number | null = null;
    private uiUtilities: UIUtilities | null = null;
    private strings: Record<string, string>;
    private emojiCalloutRef = React.createRef<EmojiICallout>();
    private baseId = 0;

    constructor(private searchBoxStrings?: LocalizedStrings<EmojiStringKeys>) {
        this.strings = {
            ...EmojiDescriptionStrings,
            ...EmojiKeywordStrings,
            ...EmojiFamilyStrings,
        };
    }

    setUIUtilities(uiUtilities: UIUtilities) {
        this.uiUtilities = uiUtilities;
    }

    public getName() {
        return 'Emoji';
    }

    public dispose() {
        this.setIsSuggesting(false);
        this.emojiCalloutRef.current?.dismiss();
        this.editor = null;
        this.baseId = 0;
    }

    public initialize(editor: IEditor): void {
        this.editor = editor;
    }

    public onPluginEvent(event: PluginEvent): void {
        if (event.eventType === 'keyDown') {
            this.eventHandledOnKeyDown = false;
            if (this.isSuggesting) {
                this.onKeyDownSuggestingDomEvent(event);
            } else if (event.rawEvent.key === 'Backspace' && this.canUndoEmoji) {
                //TODO: 1051
                // If KeyDown is backspace and canUndoEmoji, call editor undo
                undo(this.editor);

                this.handleEventOnKeyDown(event);
                this.canUndoEmoji = false;
            }
        } else if (event.eventType === 'keyUp' && !isModifierKey(event.rawEvent)) {
            if (this.isSuggesting) {
                this.onKeyUpSuggestingDomEvent(event);
            } else {
                this.onKeyUpDomEvent(event);
            }
        } else if (event.eventType === 'mouseUp') {
            //TODO: 1052
            // If MouseUp, the emoji cannot be undone
            this.canUndoEmoji = false;
            this.setIsSuggesting(false);
        }
    }

    /**
     * On KeyDown suggesting DOM event
     * Try to insert emoji is possible
     * Intercept arrow keys to move selection if popup is shown
     */
    private onKeyDownSuggestingDomEvent(event: KeyDownEvent): void {
        // If key is enter, try insert emoji at selection
        // If key is space and selection is shortcut, try insert emoji

        const wordBeforeCursor = this.getWordBeforeCursor(event);
        switch (event.rawEvent.key) {
            case 'Enter':
                const selectedEmoji = this.paneRef.current?.getSelectedEmoji();
                // check if selection is on the "..." and show full picker if so, otherwise try to apply emoji
                if (
                    !selectedEmoji ||
                    !wordBeforeCursor ||
                    this.tryShowFullPicker(event, selectedEmoji, wordBeforeCursor)
                ) {
                    break;
                } else {
                    this.insertEmoji(selectedEmoji, wordBeforeCursor);
                    this.handleEventOnKeyDown(event);
                }

                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                this.paneRef.current?.navigate(event.rawEvent.key === 'ArrowLeft' ? -1 : 1);
                this.handleEventOnKeyDown(event);
                break;
            case 'Escape':
                this.setIsSuggesting(false);
                this.handleEventOnKeyDown(event);
        }
    }

    private tryShowFullPicker(
        event: KeyDownEvent,
        selectedEmoji: Emoji,
        wordBeforeCursor: string
    ): boolean {
        if (selectedEmoji !== MoreEmoji) {
            return false;
        }

        this.handleEventOnKeyDown(event);
        this.paneRef.current?.showFullPicker(wordBeforeCursor);
        return true;
    }

    /**
     * On KeyUp suggesting DOM event
     * If key is character, update search term
     * Otherwise set isSuggesting to false
     */
    private onKeyUpSuggestingDomEvent(event: KeyUpEvent): void {
        if (this.eventHandledOnKeyDown) {
            return;
        }
        // If this is a character key or backspace
        // Clear the timer as we will either queue a new timer or stop suggesting
        if (
            this.timer &&
            ((event.rawEvent.key.length === 1 && event.rawEvent.which !== KeyCodes.space) ||
                event.rawEvent.which === KeyCodes.backspace)
        ) {
            this.editor?.getDocument().defaultView?.clearTimeout(this.timer);
            this.timer = null;
            this.emojiCalloutRef.current?.dismiss();
        }

        const wordBeforeCursor = this.getWordBeforeCursor(event);
        if (wordBeforeCursor) {
            if (this.paneRef) {
                this.paneRef.current?.setSearch(wordBeforeCursor);
            } else {
                this.setIsSuggesting(false);
            }
        } else {
            this.setIsSuggesting(false);
        }
    }

    private onKeyUpDomEvent(event: KeyUpEvent): void {
        if (this.eventHandledOnKeyDown) {
            return;
        }

        if (
            (event.rawEvent.which === KEYCODE_COLON ||
                event.rawEvent.which === KEYCODE_COLON_FIREFOX) &&
            this.getWordBeforeCursor(event) === ':'
        ) {
            this.setIsSuggesting(true);
        }
    }

    private getCallout() {
        const selection = this.editor?.getDOMSelection();
        const rangeNode = selection?.type == 'range' ? selection.range.startContainer : null;
        const rangeElement = isNodeOfType(rangeNode, 'ELEMENT_NODE')
            ? rangeNode
            : rangeNode.parentElement;
        const rect = rangeElement?.getBoundingClientRect();

        if (this.uiUtilities && rect) {
            this.baseId++;

            showEmojiCallout(
                this.uiUtilities,
                rect,
                this.strings,
                this.onSelectFromPane,
                this.paneRef,
                this.emojiCalloutRef,
                this.onHideCallout,
                this.baseId,
                this.searchBoxStrings
            );
        }
    }

    private onHideCallout = () => this.setIsSuggesting(false);

    private onSelectFromPane = (emoji: Emoji, wordBeforeCursor: string): void => {
        if (emoji === MoreEmoji) {
            this.paneRef.current?.showFullPicker(wordBeforeCursor);
            return;
        }

        this.insertEmoji(emoji, wordBeforeCursor);
    };

    private setIsSuggesting(isSuggesting: boolean): void {
        if (this.isSuggesting === isSuggesting) {
            return;
        }

        this.isSuggesting = isSuggesting;
        if (this.isSuggesting) {
            this.getCallout();
        } else if (this.emojiCalloutRef) {
            this.emojiCalloutRef.current?.dismiss();
        }
    }

    private insertEmoji(emoji: Emoji, wordBeforeCursor: string) {
        if (!wordBeforeCursor || !this.editor || !emoji.codePoint) {
            return;
        }

        this.editor.formatContentModel(model => {
            iterateSelections(model, (_, __, block, segments) => {
                if (
                    block?.blockType == 'Paragraph' &&
                    segments?.length == 1 &&
                    segments[0].segmentType == 'SelectionMarker'
                ) {
                    const index = block.segments.indexOf(segments[0]);
                    const previousSegment = block.segments[index - 1];

                    if (
                        previousSegment?.segmentType == 'Text' &&
                        previousSegment.text.endsWith(wordBeforeCursor)
                    ) {
                        mutateSegment(block, previousSegment, segment => {
                            segment.text =
                                segment.text.substring(
                                    0,
                                    segment.text.length - wordBeforeCursor.length
                                ) + emoji.codePoint;
                        });
                    }
                }

                return true;
            });

            return true;
        });

        this.emojiCalloutRef.current?.dismiss();
    }

    private getWordBeforeCursor(event: PluginEvent): string | null {
        let wordBeforeCursor: string | null = null;

        this.editor.formatContentModel(model => {
            iterateSelections(model, (_, __, block, segments) => {
                if (
                    block?.blockType == 'Paragraph' &&
                    segments?.length == 1 &&
                    segments[0].segmentType == 'SelectionMarker'
                ) {
                    const index = block.segments.indexOf(segments[0]);
                    const prevSegment = block.segments[index - 1];

                    if (prevSegment?.segmentType == 'Text') {
                        // Match on the white space, the portion after space is on the index of 1 of the matched result
                        // (index at 0 is whole match result, index at 1 is the word)
                        const matches = WHITESPACE_REGEX.exec(prevSegment.text);
                        wordBeforeCursor = matches?.length == 2 ? matches[1] : prevSegment.text;
                    }
                }

                return true;
            });
            return false;
        });

        const matches = wordBeforeCursor ? EMOJI_BEFORE_COLON_REGEX.exec(wordBeforeCursor) : null;
        return matches && matches.length > 2 && matches[0] === wordBeforeCursor ? matches[2] : null;
    }

    private handleEventOnKeyDown(event: KeyDownEvent): void {
        this.eventHandledOnKeyDown = true;
        event.rawEvent.preventDefault();
        event.rawEvent.stopImmediatePropagation();
    }
}

/**
 * Create a new instance of Emoji plugin with FluentUI components.
 */
export function createEmojiPlugin(
    searchBoxStrings?: LocalizedStrings<EmojiStringKeys>
): ReactEditorPlugin {
    return new EmojiPlugin(searchBoxStrings);
}
