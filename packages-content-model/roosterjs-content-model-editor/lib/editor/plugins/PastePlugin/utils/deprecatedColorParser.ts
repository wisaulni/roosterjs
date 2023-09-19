import { BorderFormat, FormatParser } from 'roosterjs-content-model-types';
import { BorderKeys, DeprecatedColors } from 'roosterjs-content-model-dom';

/**
 * @internal
 */
export const deprecatedBorderColorParser: FormatParser<BorderFormat> = (
    format: BorderFormat
): void => {
    BorderKeys.forEach(key => {
        const value = format[key];
        let color: string = '';
        if (
            value &&
            DeprecatedColors.some(dColor => value.indexOf(dColor) > -1 && (color = dColor))
        ) {
            const newValue = value.replace(color, '').trimRight();
            format[key] = newValue;
        }
    });
};
