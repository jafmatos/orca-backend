export interface Seeder<T = unknown> {
  seed(): Promise<T>;
}
