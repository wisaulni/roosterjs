import { createBr } from '../../../lib/modelApi/creators/createBr';
import { createCodeDecorator } from '../../../lib/modelApi/creators/createCodeDecorator';
import { createContentModelDocument } from '../../../lib/modelApi/creators/createContentModelDocument';
import { createDivider } from '../../../lib/modelApi/creators/createDivider';
import { createEntity } from '../../../lib/modelApi/creators/createEntity';
import { createFormatContainer } from '../../../lib/modelApi/creators/createFormatContainer';
import { createFormatObject } from '../../../lib/modelApi/creators/createFormatObject';
import { createGeneralBlock } from '../../../lib/modelApi/creators/createGeneralBlock';
import { createGeneralSegment } from '../../../lib/modelApi/creators/createGeneralSegment';
import { createImage } from '../../../lib/modelApi/creators/createImage';
import { createLinkDecorator } from '../../../lib/modelApi/creators/createLinkDecorator';
import { createListItem } from '../../../lib/modelApi/creators/createListItem';
import { createListLevel } from '../../../lib/modelApi/creators/createListLevel';
import { createParagraph } from '../../../lib/modelApi/creators/createParagraph';
import { createParagraphDecorator } from '../../../lib/modelApi/creators/createParagraphDecorator';
import { createSelectionMarker } from '../../../lib/modelApi/creators/createSelectionMarker';
import { createTable } from '../../../lib/modelApi/creators/createTable';
import { createTableCell } from '../../../lib/modelApi/creators/createTableCell';
import { createTableRow } from '../../../lib/modelApi/creators/createTableRow';
import { createText } from '../../../lib/modelApi/creators/createText';
import { internalConvertToMutableType } from '../../../lib/modelApi/creators/internalConvertToMutableType';
import {
    ContentModelCode,
    ContentModelLink,
    ContentModelListLevel,
    ContentModelSegmentFormat,
    ContentModelTableCellFormat,
    DatasetFormat,
} from 'roosterjs-content-model-types';

describe('Creators', () => {
    it('createContentModelDocument', () => {
        const result = createContentModelDocument();

        expect(result).toEqual({
            blockGroupType: 'Document',
            blocks: [],
        });
    });

    it('createContentModelDocument with default format', () => {
        const result = createContentModelDocument({
            fontSize: '10pt',
        });

        expect(result).toEqual({
            blockGroupType: 'Document',
            blocks: [],
            format: {
                fontSize: '10pt',
            },
        });
    });

    it('createGeneralBlock', () => {
        const element = document.createElement('div');
        const result = createGeneralBlock(element);

        expect(result).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'General',
            element: element,
            blocks: [],
            format: {},
        });
    });

    it('createGeneralSegment', () => {
        const element = document.createElement('div');
        const result = createGeneralSegment(element);

        expect(result).toEqual({
            segmentType: 'General',
            blocks: [],
            element: element,
            blockType: 'BlockGroup',
            blockGroupType: 'General',
            format: {},
        });
    });

    it('createGeneralSegment with format', () => {
        const element = document.createElement('div');
        const format = { a: 1 } as any;
        const result = createGeneralSegment(element, format);

        expect(result).toEqual({
            segmentType: 'General',
            blocks: [],
            element: element,
            blockType: 'BlockGroup',
            blockGroupType: 'General',
            format: { a: 1 } as any,
        });

        (<any>result.format).a = 2;

        expect(format).toEqual({ a: 1 });
    });

    it('createParagraph - not implicit block', () => {
        const result = createParagraph(false);

        expect(result).toEqual({
            blockType: 'Paragraph',
            segments: [],
            format: {},
        });
    });

    it('createParagraph - implicit block', () => {
        const result = createParagraph(true);

        expect(result).toEqual({
            blockType: 'Paragraph',
            segments: [],
            format: {},
            isImplicit: true,
        });
    });

    it('createParagraph - with segment format', () => {
        const result = createParagraph(false, undefined, { fontSize: '10px' });

        expect(result).toEqual({
            blockType: 'Paragraph',
            segments: [],
            format: {},
            segmentFormat: { fontSize: '10px' },
        });
    });

    it('createParagraph - with decorator', () => {
        const result = createParagraph(false, undefined, undefined, {
            tagName: 'p',
            format: {
                fontSize: '10px',
            },
        });

        expect(result).toEqual({
            blockType: 'Paragraph',
            segments: [],
            format: {},
            decorator: {
                tagName: 'p',
                format: {
                    fontSize: '10px',
                },
            },
        });
    });

    it('createParagraphDecorator', () => {
        const format = {
            fontSize: '10px',
        };
        const result = createParagraphDecorator('p', format);

        expect(result).toEqual({
            tagName: 'p',
            format: format,
        });

        result.format.fontSize = '12px';

        expect(format).toEqual({
            fontSize: '10px',
        });
    });

    it('createText', () => {
        const text = 'test';
        const result = createText(text);

        expect(result).toEqual({
            segmentType: 'Text',
            format: {},
            text: text,
        });
    });

    it('createText', () => {
        const format = { a: 1 } as any;
        const text = 'test';
        const result = createText(text, format);

        expect(result).toEqual({
            segmentType: 'Text',
            format: { a: 1 } as any,
            text: text,
        });

        (<any>result.format).a = 2;

        expect(format).toEqual({ a: 1 });
    });

    it('createText with decorators', () => {
        const format = { a: 1 } as any;
        const text = 'test';
        const link: ContentModelLink = {
            dataset: {},
            format: {
                href: 'test',
            },
        };
        const code: ContentModelCode = {
            format: { fontFamily: 'test' },
        };
        const result = createText(text, format, link, code);

        expect(result).toEqual({
            segmentType: 'Text',
            format: { a: 1 } as any,
            text: text,
            link,
            code,
        });
        expect(result.link).not.toBe(link);
        expect(result.code).not.toBe(code);

        result.link!.dataset.a = 'b';
        result.link!.format.href = 'test2';

        expect(link).toEqual({
            dataset: {},
            format: {
                href: 'test',
            },
        });

        result.code!.format.fontFamily = 'test2';

        expect(code).toEqual({
            format: { fontFamily: 'test' },
        });
    });

    it('createTable', () => {
        const tableModel = createTable(2);

        expect(tableModel).toEqual({
            blockType: 'Table',
            rows: [
                { format: {}, height: 0, cells: [] },
                { format: {}, height: 0, cells: [] },
            ],
            format: {},
            widths: [],
            dataset: {},
        });
    });

    it('createTableCell from Table Cell - no span', () => {
        const tdModel = createTableCell(1 /*colSpan*/, 1 /*rowSpan*/, false /*isHeader*/);
        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: false,
            isHeader: false,
            format: {},
            dataset: {},
        });
    });

    it('createTableCell from Table Cell - span left', () => {
        const tdModel = createTableCell(2 /*colSpan*/, 1 /*rowSpan*/, false /*isHeader*/);
        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: true,
            spanAbove: false,
            isHeader: false,
            format: {},
            dataset: {},
        });
    });

    it('createTableCell from Table Cell - span above', () => {
        const tdModel = createTableCell(1 /*colSpan*/, 3 /*rowSpan*/, false /*isHeader*/);
        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: true,
            isHeader: false,
            format: {},
            dataset: {},
        });
    });

    it('createTableCell from Table Header', () => {
        const tdModel = createTableCell(1 /*colSpan*/, 1 /*rowSpan*/, true /*isHeader*/);
        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: false,
            isHeader: true,
            format: {},
            dataset: {},
        });
    });

    it('createTableCell with format', () => {
        const format: ContentModelTableCellFormat = {
            textAlign: 'start',
        };
        const tdModel = createTableCell(1 /*colSpan*/, 1 /*rowSpan*/, true /*isHeader*/, format);

        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: false,
            isHeader: true,
            format: { textAlign: 'start' },
            dataset: {},
        });

        // Change original format object should not impact the created table cell
        format.textAlign = 'end';

        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: false,
            isHeader: true,
            format: { textAlign: 'start' },
            dataset: {},
        });
    });

    it('createTableCell with dataset', () => {
        const obj = { bgColorOverride: true, vAlignOverride: true, borderOverride: true };
        const dataset: DatasetFormat = {
            'data-editing-info': JSON.stringify(obj),
        };
        const unchangedDataset = { ...dataset };
        const tdModel = createTableCell(
            1 /*colSpan*/,
            1 /*rowSpan*/,
            false /*isHeader*/,
            undefined /*format*/,
            dataset
        );

        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: false,
            isHeader: false,
            format: {},
            dataset: unchangedDataset,
        });

        // Change original dataset object should not impact the created table cell
        dataset['data-editing-info'] = JSON.stringify({
            bgColorOverride: false,
            vAlignOverride: false,
            borderOverride: false,
        });

        expect(tdModel).toEqual({
            blockGroupType: 'TableCell',
            blocks: [],
            spanLeft: false,
            spanAbove: false,
            isHeader: false,
            format: {},
            dataset: unchangedDataset,
        });
    });

    it('createSelectionMarker', () => {
        const marker = createSelectionMarker();

        expect(marker).toEqual({
            segmentType: 'SelectionMarker',
            isSelected: true,
            format: {},
        });
    });

    it('createSelectionMarker with selection', () => {
        const format = { a: 1 } as any;
        const marker = createSelectionMarker(format);

        expect(marker).toEqual({
            segmentType: 'SelectionMarker',
            isSelected: true,
            format: { a: 1 } as any,
        });

        (<any>marker.format).a = 2;

        expect(format).toEqual({ a: 1 });
    });

    it('createBr', () => {
        const br = createBr();

        expect(br).toEqual({
            segmentType: 'Br',
            format: {},
        });
    });

    it('createBr with format', () => {
        const format = { a: 1 } as any;
        const br = createBr(format);

        expect(br).toEqual({
            segmentType: 'Br',
            format: { a: 1 } as any,
        });

        (<any>br.format).a = 2;

        expect(format).toEqual({ a: 1 });
    });

    it('createListItem', () => {
        const listItem = createListItem([]);

        expect(listItem).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'ListItem',
            blocks: [],
            levels: [],
            formatHolder: {
                segmentType: 'SelectionMarker',
                isSelected: false,
                format: {},
            },
            format: {},
        });
    });

    it('createListItem with format and levels', () => {
        const format: ContentModelSegmentFormat = { fontSize: 'a' };
        const levels: ContentModelListLevel[] = [{ listType: 'OL', dataset: {}, format: {} }];
        const listItem = createListItem(levels, format);

        expect(listItem).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'ListItem',
            blocks: [],
            levels: [{ listType: 'OL', dataset: {}, format: {} }],
            formatHolder: {
                segmentType: 'SelectionMarker',
                isSelected: false,
                format: { fontSize: 'a' },
            },
            format: {},
        });

        format.fontSize = 'b';
        levels[0].listType = 'UL';
        levels.push(createListLevel('UL'));

        // format and levels in list item should not be impacted by the change of format and levels object
        expect(listItem).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'ListItem',
            blocks: [],
            levels: [{ listType: 'OL', dataset: {}, format: {} }],
            formatHolder: {
                segmentType: 'SelectionMarker',
                isSelected: false,
                format: { fontSize: 'a' },
            },
            format: {},
        });
    });

    it('createQuote', () => {
        const quote = createFormatContainer('blockquote');

        expect(quote).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'FormatContainer',
            tagName: 'blockquote',
            blocks: [],
            format: {},
        });
    });

    it('createQuote with format', () => {
        const quote = createFormatContainer('blockquote', {
            borderLeft: 'solid 1px black',
        });

        expect(quote).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'FormatContainer',
            tagName: 'blockquote',
            blocks: [],
            format: { borderLeft: 'solid 1px black' },
        });
    });

    it('createFormatContainer with format', () => {
        const quote = createFormatContainer('pre', {
            borderLeft: 'solid 1px black',
        });

        expect(quote).toEqual({
            blockType: 'BlockGroup',
            blockGroupType: 'FormatContainer',
            tagName: 'pre',
            blocks: [],
            format: { borderLeft: 'solid 1px black' },
        });
    });

    it('createEntity', () => {
        const id = 'entity_1';
        const entityType = 'entity';
        const isReadonly = true;
        const wrapper = document.createElement('div');
        const entityModel = createEntity(wrapper, isReadonly, undefined, entityType, id);

        expect(entityModel).toEqual({
            blockType: 'Entity',
            segmentType: 'Entity',
            format: {},
            entityFormat: {
                id,
                entityType,
                isReadonly,
            },
            wrapper,
        });
    });

    it('createEntity with format', () => {
        const id = 'entity_1';
        const entityType = 'entity';
        const isReadonly = true;
        const wrapper = document.createElement('div');
        const entityModel = createEntity(
            wrapper,
            isReadonly,
            {
                fontSize: '10pt',
            },
            entityType,
            id
        );

        expect(entityModel).toEqual({
            blockType: 'Entity',
            segmentType: 'Entity',
            format: { fontSize: '10pt' },
            entityFormat: {
                id,
                entityType,
                isReadonly,
            },
            wrapper,
        });
    });

    it('createImage', () => {
        const imageModel = createImage('test');

        expect(imageModel).toEqual({
            segmentType: 'Image',
            format: {},
            src: 'test',
            dataset: {},
        });
    });

    it('createDivider', () => {
        const hr = createDivider('hr');

        expect(hr).toEqual({
            blockType: 'Divider',
            tagName: 'hr',
            format: {},
        });
    });

    it('createDivider with format', () => {
        const hr = createDivider('div', { marginTop: '10px' });

        expect(hr).toEqual({
            blockType: 'Divider',
            tagName: 'div',
            format: { marginTop: '10px' },
        });
    });

    it('createCodeDecorator', () => {
        const code = createCodeDecorator();

        expect(code).toEqual({ format: {} });
    });

    it('createCodeDecorator with format', () => {
        const code = createCodeDecorator({ fontFamily: 'Arial' });

        expect(code).toEqual({ format: { fontFamily: 'Arial' } });
    });

    it('createFormatObject', () => {
        const format = createFormatObject<any>();
        expect(format).toEqual({});
    });

    it('createFormatObject with formats', () => {
        const format1 = {
            a: 1,
            b: 2,
        };
        const format2 = {
            b: 3,
            c: 4,
        };
        const format = createFormatObject<any>(format1, format2);

        expect(format).toEqual({
            a: 1,
            b: 3,
            c: 4,
        });

        format.a = 5;
        format.b = 6;
        format.c = 7;

        expect(format1).toEqual({
            a: 1,
            b: 2,
        });
        expect(format2).toEqual({
            b: 3,
            c: 4,
        });
    });

    it('createLinkDecorator', () => {
        const link = createLinkDecorator();

        expect(link).toEqual({
            format: {},
            dataset: {},
        });
    });

    it('createLinkDecorator with format', () => {
        const link = createLinkDecorator({ href: 'test' }, { a: 'b' });

        expect(link).toEqual({
            format: { href: 'test' },
            dataset: { a: 'b' },
        });
    });

    it('createTableRow', () => {
        const row = createTableRow();

        expect(row).toEqual({
            height: 0,
            format: {},
            cells: [],
        });
    });

    it('createTableRow with format', () => {
        const mockedCell1 = { name: '1' } as any;
        const mockedCell2 = { name: '2' } as any;
        const row = createTableRow({ direction: 'ltr' }, 100, [mockedCell1, mockedCell2]);

        expect(row).toEqual({
            height: 100,
            format: { direction: 'ltr' },
            cells: [mockedCell1, mockedCell2],
        });
    });

    it('internalConvertToMutableType', () => {
        const source = { name: 'SOURCE' } as any;
        const result = internalConvertToMutableType(source);

        expect(result).toBe(source);
        expect(result).toEqual({ name: 'SOURCE' } as any);
    });
});
