export class Alert {
  constructor(
    public type: string,
    public message: string,
    public options: any = {},
  ) {
    this.options = options || {};
    this.options.spinner = this.options.spinner || false;
    this.options.closable = this.options.closable || false;
    this.options.autoClose = this.options.autoClose || 0;
  }
}
