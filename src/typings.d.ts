export type _temp = null

declare global {

  interface AppConfig {
    name: string | null,
    server: string | null,
    fullscreen: boolean,
    devTools: boolean,
  }

  type SectionName = 'webview'
    | 'index'
    | 'settings'

  interface ShowSection {
    key: SectionName;
  }

  interface ShowURLSection extends ShowSection {
    key: 'webview',
    url: string,
  }

  interface StoredMonitorState {
    server: string | null,
    command: string | null,
    commandSetBy: string | null,
  }

  interface MonitorState extends StoredMonitorState {
    name: string | null,
    serverName: string | null,
  }

  namespace Electron {

    interface IpcRenderer extends NodeJS.EventEmitter {
      /**
       * Called to change the state of the given montor
       */
      on(channel: 'state-set', listener: (event: IpcRendererEvent, data: MonitorState) => void): this
    }

    interface WebContents extends NodeJS.EventEmitter {
      send(channel: 'state-set', arg: MonitorState): void;
    }

    interface IpcMain extends NodeJS.EventEmitter {
      on(channel: 'settings-saved', listener: (event: IpcMainEvent, settings: {name: string, server: string}) => void): this

      /**
       * Sets the command for the sender window
       */
      on(channel: 'set-command', listener: (event: IpcMainEvent, data: { command: string, commandSetBy: string }) => void): this
    }
  }
}