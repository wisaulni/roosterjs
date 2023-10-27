import type { CorePlugins } from './CorePlugins';
import type { PluginWithState } from './PluginWithState';

/**
 * Names of core plugins
 */
export type ContentModelPluginKey = keyof CorePlugins;

/**
 * Names of the core plugins that have plugin state
 */
export type KeyOfStatePlugin<
    Key extends ContentModelPluginKey
> = CorePlugins[Key] extends PluginWithState<infer U> ? Key : never;

/**
 * Get type of a plugin with state
 */
export type TypeOfStatePlugin<
    Key extends ContentModelPluginKey
> = CorePlugins[Key] extends PluginWithState<infer U> ? U : never;

/**
 * All names of plugins with plugin state
 */
export type StatePluginKeys<Key extends ContentModelPluginKey> = {
    [P in Key]: KeyOfStatePlugin<P>;
}[Key];

/**
 * A type map from name of plugin with state to its plugin type
 */
export type GenericPluginState<Key extends ContentModelPluginKey> = {
    [P in StatePluginKeys<Key>]: TypeOfStatePlugin<P>;
};

/**
 * Auto-calculated State object type for plugin with states
 */
export type PluginState = GenericPluginState<ContentModelPluginKey>;
