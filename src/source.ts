export class BaseSource {
  private _url: string
  onChange: (url: string) => void = () => null
  set url (v) {
    if (v === this._url) {
      this._url = v
      return
    }
    this.onChange(v)
  }
  get url () {
    return this._url
  }
}
