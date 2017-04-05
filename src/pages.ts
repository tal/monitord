export interface PageStore<K extends string, T> {
  key: K,
  data: T,
}

export abstract class Page<K extends string, T> {
  key: K
  data: T

  constructor({ key, data }: PageStore<K, T>) {
    this.key = key
    this.data = data
  }

  abstract get url(): string

  get store(): PageStore<K, T> {
    return {
      key: this.key,
      data: this.data,
    }
  }
}

export interface IndexData { }
export class IndexPage extends Page<'index', IndexData> {
  get url() {
    return `file://${__dirname}/../public/index.html`
  }
}

export interface SettingsData { }
export class SettingsPage extends Page<'settings', SettingsData> {
  get url() {
    return `file://${__dirname}/../public/settings.html`
  }
}

export interface TumblrTVData {
  term: string,
}
export class TumblrTVPage extends Page<'tumblrTV', TumblrTVData> {
  get url() {
    return `https://www.tumblr.com/tv/${this.data.term}`
  }
}

export interface UrlPageData {
  href: string,
}
export class UrlPage extends Page<'url', UrlPageData> {
  get url() {
    return this.data.href.replace(/\&amp\;/g, '&')
    // return `file://${__dirname}/../public/external.html#${this.data.href}`
  }
}

