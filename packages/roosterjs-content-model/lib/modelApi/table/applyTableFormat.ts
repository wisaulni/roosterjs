import { BorderFormat } from '../../publicTypes/format/formatParts/BorderFormat';
import { BorderKeys } from '../../formatHandlers/common/borderFormatHandler';
import { combineBorderValue, extractBorderValues } from '../../domUtils/borderValues';
import { ContentModelTable } from '../../publicTypes/block/ContentModelTable';
import { ContentModelTableCell } from '../../publicTypes/group/ContentModelTableCell';
import { setTableCellBackgroundColor } from './setTableCellBackgroundColor';
import { TableBorderFormat } from 'roosterjs-editor-types';
import { TableMetadataFormat } from '../../publicTypes/format/formatParts/TableMetadataFormat';
import { updateTableCellMetadata } from '../../domUtils/metadata/updateTableCellMetadata';
import { updateTableMetadata } from '../../domUtils/metadata/updateTableMetadata';

const DEFAULT_FORMAT: Required<TableMetadataFormat> = {
    topBorderColor: '#ABABAB',
    bottomBorderColor: '#ABABAB',
    verticalBorderColor: '#ABABAB',
    hasHeaderRow: false,
    hasFirstColumn: false,
    hasBandedRows: false,
    hasBandedColumns: false,
    bgColorEven: null,
    bgColorOdd: '#ABABAB20',
    headerRowColor: '#ABABAB',
    tableBorderFormat: TableBorderFormat.DEFAULT,
};

/**
 * @internal
 */
export function applyTableFormat(
    table: ContentModelTable,
    newFormat?: TableMetadataFormat,
    keepCellShade?: boolean
) {
    const { cells } = table;

    updateTableMetadata(table, format => {
        const effectiveMetadata = {
            ...DEFAULT_FORMAT,
            ...format,
            ...(newFormat || {}),
        };

        const bgColorOverrides = updateBgColorOverrides(cells, !keepCellShade);

        formatBorders(cells, effectiveMetadata);
        formatBackgroundColors(cells, effectiveMetadata, bgColorOverrides);
        setFirstColumnFormat(cells, effectiveMetadata, bgColorOverrides);
        setHeaderRowFormat(cells, effectiveMetadata, bgColorOverrides);

        return effectiveMetadata;
    });
}

function updateBgColorOverrides(
    cells: ContentModelTableCell[][],
    forceClear: boolean
): boolean[][] {
    const result: boolean[][] = [];

    cells.forEach(row => {
        const currentRow: boolean[] = [];

        result.push(currentRow);

        row.forEach(cell => {
            updateTableCellMetadata(cell, metadata => {
                if (metadata && forceClear) {
                    currentRow.push(false);
                    delete metadata.bgColorOverride;
                } else {
                    currentRow.push(!!metadata?.bgColorOverride);
                }

                return metadata;
            });
        });
    });

    return result;
}

type ShouldUseTransparentBorder = (indexProp: {
    firstRow: boolean;
    lastRow: boolean;
    firstColumn: boolean;
    lastColumn: boolean;
}) => [boolean, boolean, boolean, boolean];

const BorderFormatters: Record<TableBorderFormat, ShouldUseTransparentBorder> = {
    [TableBorderFormat.DEFAULT]: _ => [false, false, false, false],
    [TableBorderFormat.LIST_WITH_SIDE_BORDERS]: ({ lastColumn, firstColumn }) => [
        false,
        !lastColumn,
        false,
        !firstColumn,
    ],
    [TableBorderFormat.FIRST_COLUMN_HEADER_EXTERNAL]: ({
        firstColumn,
        firstRow,
        lastColumn,
        lastRow,
    }) => [
        !firstRow,
        (!lastColumn && !firstColumn) || (firstColumn && firstRow),
        !lastRow && !firstRow,
        !firstColumn,
    ],
    [TableBorderFormat.NO_HEADER_BORDERS]: ({ firstRow, firstColumn, lastColumn }) => [
        firstRow,
        firstRow || lastColumn,
        false,
        firstRow || firstColumn,
    ],
    [TableBorderFormat.NO_SIDE_BORDERS]: ({ firstColumn, lastColumn }) => [
        false,
        lastColumn,
        false,
        firstColumn,
    ],
    [TableBorderFormat.ESPECIAL_TYPE_1]: ({ firstRow, firstColumn }) => [
        firstColumn && !firstRow,
        firstRow,
        firstColumn && !firstRow,
        firstRow && !firstColumn,
    ],
    [TableBorderFormat.ESPECIAL_TYPE_2]: ({ firstRow, firstColumn }) => [
        !firstRow,
        firstRow || !firstColumn,
        !firstRow,
        !firstColumn,
    ],
    [TableBorderFormat.ESPECIAL_TYPE_3]: ({ firstColumn, firstRow }) => [
        true,
        firstRow || !firstColumn,
        !firstRow,
        true,
    ],
    [TableBorderFormat.CLEAR]: () => [true, true, true, true],
};

function formatBorders(cells: ContentModelTableCell[][], format: TableMetadataFormat) {
    cells.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            const transparentBorderMatrix = BorderFormatters[
                format.tableBorderFormat as TableBorderFormat
            ]({
                firstRow: rowIndex === 0,
                lastRow: rowIndex === cells.length - 1,
                firstColumn: cellIndex === 0,
                lastColumn: cellIndex === row.length - 1,
            });

            const formatColor = [
                format.topBorderColor,
                format.verticalBorderColor,
                format.bottomBorderColor,
                format.verticalBorderColor,
            ];

            transparentBorderMatrix.forEach((alwaysUseTransparent, i) => {
                cell.format[BorderKeys[i]] = combineBorderValue({
                    style: 'solid',
                    width: '1px',
                    color: (!alwaysUseTransparent && formatColor[i]) || 'transparent',
                });
            });
        });
    });
}

function formatBackgroundColors(cells: ContentModelTableCell[][], format: TableMetadataFormat) {
    const { hasBandedRows, hasBandedColumns, bgColorOdd, bgColorEven } = format;

    cells.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (!cell.format.bgColorOverride) {
                const color =
                    hasBandedRows || hasBandedColumns
                        ? (hasBandedColumns && colIndex % 2 != 0) ||
                          (hasBandedRows && rowIndex % 2 != 0)
                            ? bgColorOdd
                            : bgColorEven
                        : bgColorEven;

                setTableCellBackgroundColor(cell, color);
            }
        });
    });
}

function setFirstColumnFormat(
    cells: ContentModelTableCell[][],
    format: Partial<TableMetadataFormat>,
    bgColorOverrides: boolean[][]
) {
    cells.forEach((row, rowIndex) => {
        row.forEach((cell, cellIndex) => {
            if (format.hasFirstColumn && cellIndex === 0) {
                cell.isHeader = true;

                if (rowIndex !== 0 && !cell.format.bgColorOverride) {
                    setBorderColor(cell.format, 'borderTop', 'transparent');
                    setBackgroundColor(cell.format, null /*color*/);
                }

                if (rowIndex !== cells.length - 1 && rowIndex !== 0) {
                    setBorderColor(cell.format, 'borderBottom', 'transparent');
                }
            } else {
                cell.isHeader = false;
            }
        });
    });
}

function setHeaderRowFormat(
    cells: ContentModelTableCell[][],
    format: TableMetadataFormat,
    bgColorOverrides: boolean[][]
) {
    const rowIndex = 0;

    cells[rowIndex]?.forEach((cell, cellIndex) => {
        cell.isHeader = format.hasHeaderRow;

        if (format.hasHeaderRow && format.headerRowColor) {
            if (!bgColorOverrides[rowIndex][cellIndex]) {
                setTableCellBackgroundColor(cell, format.headerRowColor);
            }

            setBorderColor(cell.format, 'borderTop', format.headerRowColor);
            setBorderColor(cell.format, 'borderRight', format.headerRowColor);
            setBorderColor(cell.format, 'borderLeft', format.headerRowColor);
        }
    });
}

function setBorderColor(format: BorderFormat, key: keyof BorderFormat, value?: string) {
    const border = extractBorderValues(format[key]);
    border.color = value || 'transparent';
    format[key] = combineBorderValue(border);
}

function setBackgroundColor(format: ContentModelTableCellFormat, color: string | null | undefined) {
    if (color && !format.bgColorOverride) {
        format.backgroundColor = color;

        // TODO: Handle text color when background color is dark
    } else {
        delete format.backgroundColor;
    }
}
