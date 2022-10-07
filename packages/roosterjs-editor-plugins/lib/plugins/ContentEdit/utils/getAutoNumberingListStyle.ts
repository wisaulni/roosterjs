import { NumberingListType } from 'roosterjs-editor-types';
import { VListChain } from 'roosterjs-editor-dom';

const enum NumberingTypes {
    Decimal = 1,
    LowerAlpha = 2,
    UpperAlpha = 3,
    LowerRoman = 4,
    UpperRoman = 5,
}

const enum Character {
    Dot = 1,
    Dash = 2,
    Parenthesis = 3,
    DoubleParenthesis = 4,
}

const characters: Record<string, number> = {
    '.': Character.Dot,
    '-': Character.Dash,
    ')': Character.Parenthesis,
};

const numberingTriggers = ['1', 'a', 'A', 'I', 'i'];
const lowerRomanNumbers = ['i', 'v', 'x', 'l', 'c', 'd', 'm'];
const upperRomanNumbers = ['I', 'V', 'X', 'L', 'C', 'D', 'M'];

const identifyNumberingType = (text: string, previousListStyle?: NumberingListType) => {
    console.log(lowerRomanNumbers.indexOf(text[0]) > -1);
    if (!isNaN(parseInt(text))) {
        return NumberingTypes.Decimal;
    } else if (/[a-z]+/g.test(text)) {
        if (
            (previousListStyle === NumberingListType.LowerRoman &&
                lowerRomanNumbers.indexOf(text[0]) > -1) ||
            (!previousListStyle && text === 'i')
        ) {
            return NumberingTypes.LowerRoman;
        } else if (previousListStyle || (!previousListStyle && text === 'a')) {
            return NumberingTypes.LowerAlpha;
        }
    } else if (/[A-Z]+/g.test(text)) {
        if (
            (previousListStyle === NumberingListType.LowerRoman &&
                upperRomanNumbers.indexOf(text[0]) > -1) ||
            (!previousListStyle && text === 'I')
        ) {
            return NumberingTypes.UpperRoman;
        } else if (previousListStyle || (!previousListStyle && text === 'A')) {
            return NumberingTypes.UpperAlpha;
        }
    }
};

const numberingListTypes: Record<number, (char: number) => number | null> = {
    [NumberingTypes.Decimal]: char => DecimalsTypes[char] || null,
    [NumberingTypes.LowerAlpha]: char => LowerAlphaTypes[char] || null,
    [NumberingTypes.UpperAlpha]: char => UpperAlphaTypes[char] || null,
    [NumberingTypes.LowerRoman]: char => LowerRomanTypes[char] || null,
    [NumberingTypes.UpperRoman]: char => UpperRomanTypes[char] || null,
};

const UpperRomanTypes: Record<number, number> = {
    [Character.Dot]: NumberingListType.UpperRoman,
    [Character.Dash]: NumberingListType.UpperRomanDash,
    [Character.Parenthesis]: NumberingListType.UpperRomanParenthesis,
    [Character.DoubleParenthesis]: NumberingListType.UpperRomanDoubleParenthesis,
};

const LowerRomanTypes: Record<number, number> = {
    [Character.Dot]: NumberingListType.LowerRoman,
    [Character.Dash]: NumberingListType.LowerRomanDash,
    [Character.Parenthesis]: NumberingListType.LowerRomanParenthesis,
    [Character.DoubleParenthesis]: NumberingListType.LowerRomanDoubleParenthesis,
};

const UpperAlphaTypes: Record<number, number> = {
    [Character.Dot]: NumberingListType.UpperAlpha,
    [Character.Dash]: NumberingListType.UpperAlphaDash,
    [Character.Parenthesis]: NumberingListType.UpperAlphaParenthesis,
    [Character.DoubleParenthesis]: NumberingListType.UpperAlphaDoubleParenthesis,
};

const LowerAlphaTypes: Record<number, number> = {
    [Character.Dot]: NumberingListType.LowerAlpha,
    [Character.Dash]: NumberingListType.LowerAlphaDash,
    [Character.Parenthesis]: NumberingListType.LowerAlphaParenthesis,
    [Character.DoubleParenthesis]: NumberingListType.LowerAlphaDoubleParenthesis,
};

const DecimalsTypes: Record<number, number> = {
    [Character.Dot]: NumberingListType.Decimal,
    [Character.Dash]: NumberingListType.DecimalDash,
    [Character.Parenthesis]: NumberingListType.DecimalParenthesis,
    [Character.DoubleParenthesis]: NumberingListType.DecimalDoubleParenthesis,
};

const identifyNumberingListType = (
    numbering: string,
    isDoubleParenthesis: boolean,
    previousListStyle?: NumberingListType
): NumberingListType | null => {
    const separatorCharacter = isDoubleParenthesis
        ? Character.DoubleParenthesis
        : characters[numbering[numbering.length - 1]];
    // if separator is not valid, no need to check if the number is valid.
    if (separatorCharacter) {
        const number = numbering.slice(0, -1);
        console.log(number, previousListStyle);
        const numberingType = identifyNumberingType(number, previousListStyle);
        return numberingType ? numberingListTypes[numberingType](separatorCharacter) : null;
    }
    return null;
};

/**
 * @internal
 * @param textBeforeCursor The trigger character
 * @param previousListChain (Optional) This parameters is used to keep the list chain, if the is not a new list
 * @returns The style of a numbering list triggered by a string
 */
export default function getAutoNumberingListStyle(
    textBeforeCursor: string,
    previousListChain?: VListChain[],
    previousListStyle?: NumberingListType
): NumberingListType {
    const trigger = textBeforeCursor.trim();
    //Only the staring items ['1', 'a', 'A', 'I', 'i'] must trigger a new list. All the other triggers is used to keep the list chain.
    //The index is always the character before the last character
    const listIndex = trigger[trigger.length - 2];
    const index = parseInt(listIndex);

    if (previousListChain && index > 1) {
        if (
            (previousListChain.length < 1 && numberingTriggers.indexOf(listIndex) < 0) ||
            (previousListChain?.length > 0 &&
                !previousListChain[previousListChain.length - 1]?.canAppendAtCursor(index))
        ) {
            return null;
        }
    }

    const isDoubleParenthesis = trigger[0] === '(' && trigger[trigger.length - 1] === ')';
    const numberingType = identifyNumberingListType(
        trigger,
        isDoubleParenthesis,
        previousListStyle
    );
    return numberingType;
}
