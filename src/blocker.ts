export class Blocker {
  private _promise: Promise<void>;
  private _promiseResolver: (...args: any[]) => any;
  private _isBlocked: boolean;

  constructor() {
    this._promise = Promise.resolve();
    this._promiseResolver = () => {};
    this._isBlocked = false;
  }

  block(): void {
    if (this._isBlocked) {
      return;
    }

    this._promise = new Promise(r => {
      this._promiseResolver = r;
      setTimeout(r, 2147483647);
    }); //TODO: Implement endless promise

    this._isBlocked = true;
  }

  unblock(): void {
    this._promiseResolver();

    this._isBlocked = false;
  }

  get(): Promise<void> {
    return this._promise;
  }

  isBlocked(): boolean {
    return this._isBlocked;
  }
}
