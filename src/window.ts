import {
  app,
  BrowserWindow,
  Menu,
  screen,
} from 'electron'
import * as url from 'url'
import {
  getMonitorState,
} from './config'

const templates = [
  {
    label: app.getName(),
    submenu: [
      {
        label: 'Preferences',
        accelerator: 'Cmd+,',
        click: () => {
          console.log('open prefs!')
        }
      }
    ]
  }
]

// const menu = Menu.buildFromTemplate(templates)
// Menu.setApplicationMenu(menu)

const displayIdToIndex: {[key: number]: number} = {}
const displayIndexToId: { [key: number]: number } = {}
let globalIndexCount = 0

function getIndexForId(id: number) {
  if (!displayIdToIndex[id]) {
    globalIndexCount += 1
    displayIdToIndex[id] = globalIndexCount
    displayIndexToId[globalIndexCount] = id
  }

  return displayIdToIndex[id]
}

class Display {
  name: string
  readonly window: Electron.BrowserWindow
  readonly id: number
  private socket: SocketIOClient.Socket | null

  constructor({
    window,
    id,
  }: {
    window: Electron.BrowserWindow,
    id: number,
  }) {
    this.id = id
    this.window = window
    this.socket = null
  }

  get index() {
    return getIndexForId(this.id)
  }

  get webContents() {
    return this.window.webContents
  }

  equalsWebContents(wc: Electron.WebContents) {
    return this.webContents.id === wc.id
  }

  sendState(state: MonitorState) {
    this.webContents.send('state-set', state)
  }

  sendResetSocket() {
    this.webContents.send('reset-socket')
  }

  get monitorState() {
    return getMonitorState(this.index)
  }
}

class WindowSet {
  readonly windows: { [key: number]: Display }

  constructor() {
    this.windows = {}
  }

  *[Symbol.iterator]() {
    for (let index in this.windows) {
      yield {index: +index, window: this.windows[index]}
    }
  }

  displayIndexForWindow(win: Electron.BrowserWindow) {
    for (let { index, window } of this) {
      if (window.id === win.id) {
        return index
      }
    }
  }

  displayIdForWindow(win: Electron.BrowserWindow) {
    const index = this.displayIndexForWindow(win)
    if (index) {
      return <number | undefined>displayIndexToId[index]
    }
  }

  displayForWebContents(web: Electron.WebContents) {
    for (let { index, window } of this) {
      if (window.webContents.id === web.id) {
        return window
      }
    }
  }

  displayIndexForWebContents(web: Electron.WebContents) {
    for (let { index, window } of this) {
      if (window.webContents.id === web.id) {
        return index
      }
    }
  }

  displayIdForWebContents(web: Electron.WebContents) {
    const index = this.displayIndexForWebContents(web)
    if (index) {
      return <number | undefined>displayIndexToId[index]
    }
  }

  has(id: number) {
    return id in this.windows
  }

  add(id: number, window: Electron.BrowserWindow) {
    const display = new Display({id, window})

    this.windows[display.index] = display
    return display
  }

  remove(window: number | Electron.BrowserWindow | Display) {
    if (window instanceof BrowserWindow) {
      const id = this.displayIdForWindow(window)
      if (id) {
        delete this.windows[id]
      }
    }
    else if (window instanceof Display) {
      delete this.windows[window.index]
    }
    else {
      delete this.windows[window]
    }
  }
}

let windowSet: WindowSet | undefined

function setupWindow({
  id,
  bounds,
  config,
}: {
  id: number,
  bounds: Electron.Rectangle,
  config: AppConfig,
}) {
  if (!windowSet) {
    throw 'windowset must be initialized'
  }

  if (windowSet.has(id)) {
    return
  }

  let win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: 1200,
    height: 800,
  })

  if (config.devTools) {
    win.webContents.openDevTools({
      mode: 'undocked',
    })
  }

  if (config.fullscreen) {
    win.setFullScreen(true)
  }

  win.on('closed', () => windowSet && windowSet.remove(id) )

  win.loadURL(`file://${__dirname}/../public/index.html`)

  return windowSet.add(id, win)
}

export function createWindows(config: AppConfig) {
  if (!windowSet) {
    windowSet = new WindowSet()

    const displays = screen.getAllDisplays()

    for (let display of displays) {
      setupWindow({
        id: display.id,
        bounds: display.bounds,
        config: config,
      })
    }
  }

  return windowSet
}

export default function() {
  return windowSet
}