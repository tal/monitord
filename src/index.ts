import {
  app,
  BrowserWindow,
  ipcMain,
} from 'electron'
import * as IO from 'socket.io-client'

import {createWindows} from './window'
import {
  getConfig,
  getMonitorState,
  setConfig,
  setMonitorState,
} from './config'


function connectToSocket({server, name}: {server: string, name: string}) {
  const socket = IO(server)
  socket.on('connect', () => {
    console.log(`Connected to ${server} with id ${socket.id}`)
    socket.emit('register', {
      name: name,
    })

    socket.on('navigate-to', (msg: any) => {

    })
  })
  socket.on('connect_error', (err: any) => {
    console.log({ connectError: err })
  })
}

app.on('ready', () => {
  const config = getConfig()

  createWindows(config)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.on('settings-saved', (event, arg) => {
  const config: AppConfig = {
    ...getConfig(),
    ...arg,
  }

  setConfig(config)
  updateWindows({resetSocket: true})
  setCommand(event, {
    command: 'index',
    commandSetBy: 'local',
  })
})

function updateWindows({resetSocket = false} = {}) {
  const windows = createWindows(getConfig())

  for (let {window, index} of windows) {
    const state = getMonitorState(index)

    if (resetSocket) window.sendResetSocket()
    window.sendState(state)
  }
}

function setCommand(event: Electron.IpcMainEvent, { command, commandSetBy } : {command: string, commandSetBy: string}) {
  const windows = createWindows(getConfig())

  const sender = event.sender

  const display = windows.displayForWebContents(sender)

  if (display) {
    const startState = display.monitorState

    const state: MonitorState = {
      ...startState,
      command,
      commandSetBy,
    }

    setMonitorState(display.index, state)

    display.sendState(state)
  }
  else {
    console.error(`no display id for given sender`)
  }
}

ipcMain.on('set-command', setCommand)

ipcMain.on('window-ready', (event) => {
  const windows = createWindows(getConfig())

  const sender = event.sender

  const displayIndex = windows.displayIndexForWebContents(sender)

  if (displayIndex) {
    const state = getMonitorState(displayIndex)

    event.sender.send('state-set', state)
  }
  else {
    console.error(`no display id for given sender`)
  }
})
