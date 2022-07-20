/**
 * An interface to define a replacement rule for CustomReplace plugin
 */
export default interface CustomReplacement {
    /**
     * Source string to replace from
     */
    sourceString: string;

    /**
     * HTML string to replace to
     */
    replacementHTML: string;

    /**
     * Whether the matching should be case sensitive
     */
    matchSourceCaseSensitive: boolean;

    /**
     * A callback to check if the string should be replaced
     * @param content the content where the string is
     * @param replacement string to be replaced
     * @param contentTag tagName of the html element that contains the string
     * @return true, if the string should be replaced, else return false
     */
    shouldReplace?: (
        replacement: CustomReplacement,
        content: string,
        contentTag?: string
    ) => boolean;
}
