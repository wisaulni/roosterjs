import TableEditor from './editors/TableEditor';
import { normalizeRect } from 'roosterjs-editor-dom';
import {
    CreateElementData,
    EditorPlugin,
    IEditor,
    PluginEvent,
    PluginEventType,
    Rect,
} from 'roosterjs-editor-types';

const TABLE_RESIZER_LENGTH = 12;

/**
 * TableResize plugin, provides the ability to resize a table by drag-and-drop
 */
export default class TableResize implements EditorPlugin {
    private editor: IEditor | null = null;
    private onMouseMoveDisposer: (() => void) | null = null;
    private tableRectMap: { table: HTMLTableElement; rect: Rect }[] | null = null;
    private tableEditor: TableEditor | null = null;

    /**
     * Construct a new instance of TableResize plugin
     * @param onShowHelperElement An optional callback to allow customize helper element of table resizing.
     * To customize the helper element, add this callback and change the attributes of elementData then it
     * will be picked up by TableResize code
     */
    constructor(
        private onShowHelperElement?: (
            elementData: CreateElementData,
            helperType: 'CellResizer' | 'TableInserter' | 'TableResizer' | 'TableSelector'
        ) => void
    ) {}

    /**
     * Get a friendly name of  this plugin
     */
    getName() {
        return 'TableResize';
    }

    /**
     * Initialize this plugin. This should only be called from Editor
     * @param editor Editor instance
     */
    initialize(editor: IEditor) {
        this.editor = editor;
        this.onMouseMoveDisposer = this.editor.addDomEventHandler('mousemove', this.onMouseMove);
    }

    /**
     * Dispose this plugin
     */
    dispose() {
        this.onMouseMoveDisposer?.();
        this.invalidateTableRects();
        this.setTableEditor(null);
        this.editor = null;
    }

    /**
     * Handle events triggered from editor
     * @param event PluginEvent object
     */
    onPluginEvent(e: PluginEvent) {
        switch (e.eventType) {
            case PluginEventType.Input:
            case PluginEventType.ContentChanged:
            case PluginEventType.Scroll:
            case PluginEventType.ZoomChanged:
                this.setTableEditor(null);
                this.invalidateTableRects();
                break;
        }
    }

    private onMouseMove = (e: Event) => {
        if (e instanceof MouseEvent && this.editor) {
            if (e.buttons > 0) {
                return;
            }

            this.ensureTableRects();

            const editorWindow = this.editor.getDocument().defaultView;
            if (editorWindow && this.tableRectMap) {
                const x = e.pageX - editorWindow.scrollX;
                const y = e.pageY - editorWindow.scrollY;
                let currentTable: HTMLTableElement | null = null;

                for (let i = this.tableRectMap.length - 1; i >= 0; i--) {
                    const { table, rect } = this.tableRectMap[i];

                    if (
                        x >= rect.left - TABLE_RESIZER_LENGTH &&
                        x <= rect.right + TABLE_RESIZER_LENGTH &&
                        y >= rect.top - TABLE_RESIZER_LENGTH &&
                        y <= rect.bottom + TABLE_RESIZER_LENGTH
                    ) {
                        currentTable = table;
                        break;
                    }
                }

                this.setTableEditor(currentTable, e);
                this.tableEditor?.onMouseMove(x, y);
            }
        }
    };

    private setTableEditor(table: HTMLTableElement | null, e?: MouseEvent) {
        if (this.tableEditor && table != this.tableEditor.table) {
            this.tableEditor.dispose();
            this.tableEditor = null;
        }

        if (!this.tableEditor && table && this.editor) {
            this.tableEditor = new TableEditor(
                this.editor,
                table,
                this.invalidateTableRects,
                this.onShowHelperElement,
                e
            );
        }
    }

    private invalidateTableRects = () => {
        this.tableRectMap = null;
    };

    private ensureTableRects() {
        if (!this.tableRectMap) {
            this.tableRectMap = [];
            this.editor?.queryElements('table', table => {
                if (table.isContentEditable) {
                    const rect = normalizeRect(table.getBoundingClientRect());
                    if (rect) {
                        this.tableRectMap?.push({
                            table,
                            rect,
                        });
                    }
                }
            });
        }
    }
}
