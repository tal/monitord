import * as settings from 'electron-settings'
import * as os from 'os'

console.log(`Reading settings from ${settings.file()}`)

const DEFAULT_CONFIG = {
  server: 'https://monitord.waffle.bf2.tumblr.net',
  name: os.hostname().toLowerCase().replace(/^monitor\-/i, '').replace(/\-dual$/i, ''),
  fullscreen: true,
  devTools: false,
}

function defaultMonitorState(): StoredMonitorState {
  const config = getConfig()

  return {
    server: config.server,
    command: (config.name && config.server) ? 'index' : 'settings',
    commandSetBy: null,
  }
}

function stripDefaults(obj: any, def: any) {
  let newObj: any = {}
  for (let key in obj) {
    if (obj[key] !== def[key]) {
      newObj[key] = obj[key]
    }
  }

  return newObj
}

function stripDefaultFromState(obj: StoredMonitorState) {
  return stripDefaults(obj, defaultMonitorState())
}

function stripDefaultFromConfig(obj: AppConfig) {
  return stripDefaults(obj, DEFAULT_CONFIG)
}

export function setConfig(config: AppConfig) {
  settings.set('config', stripDefaultFromConfig(config), { prettyify: true })
  return config
}

export function getConfig(): AppConfig {
  const base = settings.get<AppConfig>('config')
  return {
    ...DEFAULT_CONFIG,
    ...(base || {}),
  }
}

export function getMonitorState(index: number): MonitorState {
  const key = `monitor.${index}`
  const state: StoredMonitorState = {
    ...defaultMonitorState(),
    ...settings.get<StoredMonitorState>(key),
  }
  const config = getConfig()

  setMonitorState(index, state)

  let name: string | null = null

  if (config.name) {
    if (index === 1) {
      name = config.name
    }
    else {
      name = `${config.name}-${index}`
    }
  }

  return {
    ...state,
    name,
    serverName: config.name,
  }
}

export function setMonitorState(index: number, data: StoredMonitorState) {
  const key = `monitor.${index}`

  const objToSave = stripDefaultFromState(data)
  settings.set(key, objToSave, { prettyify: true })
  return data
}