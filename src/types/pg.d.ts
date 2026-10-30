declare module 'pg' {
  export const Client: new (options: unknown) => {
    connect(): Promise<void>;
    end(): Promise<void>;
    query(...arguments_: unknown[]): Promise<unknown>;
  };
}
