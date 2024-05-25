import * as React from 'react';
import * as ReactDOM from 'react-dom';
import BuildInPluginState from './BuildInPluginState';
import SidePane from './sidePane/SidePane';
import { createUpdateContentPlugin, UpdateContentPlugin, UpdateMode } from 'roosterjs-react';
import { PartialTheme, ThemeProvider } from '@fluentui/react/lib/Theme';
import { registerWindowForCss, unregisterWindowForCss } from '../utils/cssMonitor';
import { trustedHTMLHandler } from '../utils/trustedHTMLHandler';
import { WindowProvider } from '@fluentui/react/lib/WindowProvider';

export interface MainPaneBaseState {
    showSidePane: boolean;
    popoutWindow: Window;
    initState: BuildInPluginState;
    scale: number;
    isDarkMode: boolean;
    isRtl: boolean;
}

const PopoutRoot = 'mainPane';
const POPOUT_HTML = `<!doctype html><html><head><title>RoosterJs Demo Site</title></head><body><div id=${PopoutRoot}></div></body></html>`;
const POPOUT_FEATURES = 'menubar=no,statusbar=no,width=1200,height=800';
const POPOUT_URL = 'about:blank';
const POPOUT_TARGET = '_blank';

export default abstract class MainPaneBase<T extends MainPaneBaseState> extends React.Component<
    {},
    T
> {
    private mouseX: number;
    private static instance: MainPaneBase<MainPaneBaseState>;
    private popoutRoot: HTMLElement;

    protected sidePane = React.createRef<SidePane>();
    protected updateContentPlugin: UpdateContentPlugin;
    protected content: string = '';
    protected themeMatch = window.matchMedia?.('(prefers-color-scheme: dark)');

    static getInstance() {
        return this.instance;
    }

    static readonly editorDivId = 'RoosterJsContentDiv';

    constructor(props: {}) {
        super(props);

        MainPaneBase.instance = this;
        this.updateContentPlugin = createUpdateContentPlugin(UpdateMode.OnDispose, this.onUpdate);
    }

    abstract getStyles(): Record<string, string>;

    abstract renderRibbon(isPopout: boolean): JSX.Element;

    abstract renderTitleBar(): JSX.Element;

    abstract renderSidePane(fullWidth: boolean): JSX.Element;

    abstract resetEditor(): void;

    abstract getTheme(isDark: boolean): PartialTheme;

    abstract renderEditor(): JSX.Element;

    render() {
        const styles = this.getStyles();

        return (
            <ThemeProvider
                applyTo="body"
                theme={this.getTheme(this.state.isDarkMode)}
                className={styles.mainPane}>
                {this.renderTitleBar()}
                <div style={{ backgroundColor: '#ddd', border: 'solid 1px #aaa', padding: '3px' }}>
                    This is legacy demo site for testing only. Please navigate to{' '}
                    <a href="https://microsoft.github.io/roosterjs/index.html">New Demo Site</a> for
                    latest version.
                </div>
                {!this.state.popoutWindow && this.renderRibbon(false /*isPopout*/)}
                <div className={styles.body + ' ' + (this.state.isDarkMode ? 'dark' : '')}>
                    {this.state.popoutWindow ? this.renderPopout() : this.renderMainPane()}
                </div>
            </ThemeProvider>
        );
    }

    componentDidMount() {
        this.themeMatch?.addEventListener('change', this.onThemeChange);
        this.resetEditor();
    }

    componentWillUnmount() {
        this.themeMatch?.removeEventListener('change', this.onThemeChange);
    }

    popout() {
        this.updateContentPlugin.forceUpdate();

        const win = window.open(POPOUT_URL, POPOUT_TARGET, POPOUT_FEATURES);
        win.document.write(trustedHTMLHandler(POPOUT_HTML));
        win.addEventListener('beforeunload', () => {
            this.updateContentPlugin.forceUpdate();

            unregisterWindowForCss(win);
            this.setState({ popoutWindow: null });
        });

        registerWindowForCss(win);

        this.popoutRoot = win.document.getElementById(PopoutRoot);
        this.setState({
            popoutWindow: win,
        });
    }

    resetEditorPlugin(pluginState: BuildInPluginState) {
        this.updateContentPlugin.forceUpdate();
        this.setState({
            initState: pluginState,
        });

        this.resetEditor();
    }

    setScale(scale: number): void {
        this.setState({
            scale: scale,
        });
    }

    toggleDarkMode(): void {
        this.setState({
            isDarkMode: !this.state.isDarkMode,
        });
    }

    setPageDirection(isRtl: boolean): void {
        this.setState({ isRtl: isRtl });
        [window, this.state.popoutWindow].forEach(win => {
            if (win) {
                win.document.body.dir = isRtl ? 'rtl' : 'ltr';
            }
        });
    }

    private renderMainPane() {
        const styles = this.getStyles();

        return (
            <>
                {this.renderEditor()}
                {this.state.showSidePane ? (
                    <>
                        <div className={styles.resizer} onMouseDown={this.onMouseDown} />
                        {this.renderSidePane(false /*fullWidth*/)}
                        {this.renderSidePaneButton()}
                    </>
                ) : (
                    this.renderSidePaneButton()
                )}
            </>
        );
    }

    private renderSidePaneButton() {
        const styles = this.getStyles();

        return (
            <button
                className={`side-pane-toggle ${this.state.showSidePane ? 'open' : 'close'} ${
                    styles.showSidePane
                }`}
                onClick={this.state.showSidePane ? this.onHideSidePane : this.onShowSidePane}>
                <div>{this.state.showSidePane ? 'Hide side pane' : 'Show side pane'}</div>
            </button>
        );
    }

    private renderPopout() {
        const styles = this.getStyles();

        return (
            <>
                {this.renderSidePane(true /*fullWidth*/)}
                {ReactDOM.createPortal(
                    <WindowProvider window={this.state.popoutWindow}>
                        <ThemeProvider applyTo="body" theme={this.getTheme(this.state.isDarkMode)}>
                            <div className={styles.mainPane}>
                                {this.renderRibbon(true /*isPopout*/)}
                                <div className={styles.body}>{this.renderEditor()}</div>
                            </div>
                        </ThemeProvider>
                    </WindowProvider>,
                    this.popoutRoot
                )}
            </>
        );
    }

    private onMouseDown = (e: React.MouseEvent<EventTarget>) => {
        document.addEventListener('mousemove', this.onMouseMove, true);
        document.addEventListener('mouseup', this.onMouseUp, true);
        document.body.style.userSelect = 'none';
        this.mouseX = e.pageX;
    };

    private onMouseMove = (e: MouseEvent) => {
        this.sidePane.current.changeWidth(this.mouseX - e.pageX);
        this.mouseX = e.pageX;
    };

    private onMouseUp = (e: MouseEvent) => {
        document.removeEventListener('mousemove', this.onMouseMove, true);
        document.removeEventListener('mouseup', this.onMouseUp, true);
        document.body.style.userSelect = '';
    };

    private onUpdate = (content: string) => {
        this.content = content;
    };

    private onShowSidePane = () => {
        this.setState({
            showSidePane: true,
        });
        this.resetEditor();
    };

    private onHideSidePane = () => {
        this.setState({
            showSidePane: false,
        });
        this.resetEditor();
        window.location.hash = '';
    };

    private onThemeChange = () => {
        this.setState({
            isDarkMode: this.themeMatch?.matches || false,
        });
    };
}
