// Type declaration for optional Upstash Redis dependency
// Install: pnpm add @upstash/redis
declare module '@upstash/redis' {
  export class Redis {
    constructor(config: { url: string; token: string });
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
  }
}
