import * as appSettings from 'electron-settings'

import {
  SettingsPage,
  TumblrTVPage,
  IndexPage,
  UrlPage,
  PageStore,
} from './pages'

export default function getPageForData<K extends string, D>(data: PageStore<K, D>) {
  const configSetEh = appSettings.get('config.name') && appSettings.get('config.server')
  const hasData = !!data
  if (!data || !configSetEh) {
    return new SettingsPage({key: 'settings', data: {}})
  }

  switch (data.key as string) {
  case 'settings':
    return new SettingsPage(data as any)
  case 'tumblrTV':
    return new TumblrTVPage(data as any)
  case 'url':
    return new UrlPage(data as any)
  }

  return new IndexPage(data as any)
}