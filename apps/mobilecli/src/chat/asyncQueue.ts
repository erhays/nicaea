export class AsyncQueue<T> implements AsyncIterable<T> {
  private values: T[] = [];
  private resolvers: ((result: IteratorResult<T>) => void)[] = [];
  private rejecters: ((error: unknown) => void)[] = [];
  private done = false;
  private error: unknown = null;

  push(value: T): void {
    if (this.resolvers.length > 0) {
      this.resolvers.shift()!({ value, done: false });
      this.rejecters.shift();
    } else {
      this.values.push(value);
    }
  }

  finish(): void {
    this.done = true;
    while (this.resolvers.length > 0) {
      this.resolvers.shift()!({ value: undefined as never, done: true });
      this.rejecters.shift();
    }
  }

  fail(error: unknown): void {
    this.error = error;
    this.done = true;
    while (this.rejecters.length > 0) {
      this.rejecters.shift()!(error);
      this.resolvers.shift();
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: (): Promise<IteratorResult<T>> => {
        if (this.values.length > 0) {
          return Promise.resolve({ value: this.values.shift()!, done: false });
        }
        if (this.error) {
          return Promise.reject(this.error);
        }
        if (this.done) {
          return Promise.resolve({ value: undefined as never, done: true });
        }
        return new Promise((resolve, reject) => {
          this.resolvers.push(resolve);
          this.rejecters.push(reject);
        });
      },
    };
  }
}
