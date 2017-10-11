export class DataSaver {
  constructor(private _prefix: String) { }

  private _saveFile(data, type, ext): void {
    let blob = new Blob([data], {type: type});
    // save the data
    let url = window.URL.createObjectURL(blob);
    let a: any = document.createElement('a');
    a.style = 'display: none';
    a.href = url;
    let date = new Date();
    let prefix = (this._prefix !== undefined) ? this._prefix + '-' : '';
    a.download = prefix + date.toISOString() + '.' + ext;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  saveAsJSON(data): void {
    this._saveFile(JSON.stringify(data), 'application/json', 'json');
  }

  saveXMLasSVG(xml): void {
    this._saveFile(xml, 'image/svg+xml', 'svg');
  }
}
