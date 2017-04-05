import {
  ipcRenderer,
} from 'electron'
import * as IO from 'socket.io-client'

const webviewSection = document.getElementById('webview')
const indexSection = document.getElementById('index-page')
const settingsForm = document.getElementById('settings-form')
const settingsButton = <HTMLButtonElement>document.getElementById('settings-button')

const allSections = {
  'webview': <HTMLElement> webviewSection,
  'settings': <HTMLFormElement>settingsForm,
  'index': <HTMLElement> indexSection,
}

const tvForm = <HTMLFormElement> document.getElementById('tumblr-tv')
tvForm.addEventListener('submit', function(ev) {
  ev.preventDefault()

  const tvSearch = this.querySelector('input[type=search]')
  if (tvSearch instanceof HTMLInputElement) {
    ipcRenderer.send('set-command', `tv: ${tvSearch.value}`)
  }
})

settingsButton.addEventListener('click', function(ev) {
  ev.preventDefault()

  ipcRenderer.send('set-command', {
    command: 'settings',
    commandSetBy: 'local',
  })
})

const nameLabel = <HTMLInputElement> allSections.settings.querySelector('#name-label')
const serverLabel = <HTMLInputElement> allSections.settings.querySelector('#server-label')

allSections.settings.addEventListener('submit', (ev) => {
  ev.preventDefault()

  const { currentTarget } = ev

  if (currentTarget instanceof Element) {
    const data: any = {}
    const inputs = currentTarget.querySelectorAll('input[name]')

    for (let input of inputs) {
      if (input instanceof HTMLInputElement) {
        if (input.value.length) {
          data[input.name] = input.value
        }
        else {
          data[input.name] = null
        }
      }
    }

    ipcRenderer.send('settings-saved', data)
  }

})

function showSection(key: SectionName): HTMLElement {
  let currentSection: HTMLElement = allSections.index

  if (!(key in allSections)) {
    key = 'index'
  }

  for (let localKey in allSections) {
    const section = (allSections as { [key: string]: HTMLElement })[localKey]

    if (key === localKey) {
      section.style.display = ''
      currentSection = section
    }
    else {
      section.style.display = 'none'
    }
  }

  return currentSection
}

function decodeString(str: string) {
  var parser = new DOMParser;
  var dom = parser.parseFromString(
    '<!doctype html><body>' + str,
    'text/html');
  return dom.body.textContent || str;
}

let webview: Electron.WebViewElement | null = null

function setWebviewUrl(url: string | null) {
  if (webview) {
    webview.remove()
  }

  if (url) {
    webview = document.createElement('webview')
    webview.src = decodeString(url)

    allSections.webview.appendChild(webview)
  }
}

function setInfo({ monitor, name }: { monitor: string, name: string }) {
  const monitorEl = document.querySelector('.monitor')
  const nameEl = document.querySelector('.name')

  if (monitorEl) {
    monitorEl.textContent = monitor
  }

  if (nameEl) {
    nameEl.textContent = name
  }
}

function handleCommand({ command, server, name }: MonitorState): ShowSection {

  if (command) {
    switch (command) {
      case 'index':
      case 'settings':
        return {
          key: command,
        }
    }

    const slackUrlMatch = command.match(/\<(.+?)(?:\|.+)\>/)
    if (slackUrlMatch) {
      return <ShowURLSection>{
        key: 'webview',
        url: slackUrlMatch[1],
      }
    }

    const urlMatch = command.match(/(https?:\/\/.+?)(?:\s|$)/)
    if (urlMatch) {
      return <ShowURLSection>{
        key: 'webview',
        url: urlMatch[1],
      }
    }

    const tvMatch = command.match(/tv: (.+)/)
    if (tvMatch) {
      return <ShowURLSection>{
        key: 'webview',
        url: `https://www.tumblr.com/tv/${tvMatch[1]}`,
      }
    }
  }

  if (server && name) {
    return {
      key: 'index',
    }
  }
  else {
    return {
      key: 'settings',
    }
  }
}

function isShowSection(obj: any): obj is ShowSection {
  switch (obj.key) {
    case 'webview':
    case 'index':
    case 'settings':
      return true
    default:
      return false
  }
}

function isShowURLSection(obj: any): obj is ShowURLSection {
  return typeof obj.url === 'string' && obj.key === 'webview'
}

let mySocket: SocketIOClient.Socket | null = null
function ensureConnect({server, name}: MonitorState) {
  if (!server) return
  if (mySocket) return

  const socket = IO(server)
  socket.on('connect', () => {
    console.log(`Window: ${name} connected to ${server}`)
    socket.emit('register', {
      name,
    })
  })

  socket.on('command', ({command, commandSetBy}: any) => {
    console.log('command got by socket', command)
    ipcRenderer.send('set-command', {
      command,
      commandSetBy,
    })
  })

  mySocket = socket
}

ipcRenderer.on('reset-socket', (event) => {
  console.log(' reset socket')
  if (mySocket) {
    mySocket.disconnect()
  }
  mySocket = null
})

ipcRenderer.on('state-set', (event, data) => {
  ensureConnect(data)

  nameLabel.value = data.serverName || ''
  serverLabel.value = data.server || ''

  const section = handleCommand(data)
  showSection(section.key)

  if (isShowURLSection(section)) {
    setWebviewUrl(section.url)
  }
  else {
    setWebviewUrl(null)
  }

  setInfo({
    monitor: data.name || '',
    name: data.commandSetBy || '',
  })
})

ipcRenderer.send('window-ready')
