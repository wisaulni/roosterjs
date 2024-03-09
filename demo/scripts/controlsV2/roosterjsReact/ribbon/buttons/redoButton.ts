import { RedoButtonStringKey } from '../type/RibbonButtonStringKeys';
import { RibbonButton } from '../type/RibbonButton';

/**
 * @internal
 * "Undo" button on the format ribbon
 */
export const redoButton: RibbonButton<RedoButtonStringKey> = {
    key: 'buttonNameRedo',
    unlocalizedText: 'Redo',
    iconName: 'Redo',
    isDisabled: formatState => !formatState.canRedo,
    onClick: editor => {
        editor.redo();
    },
};
