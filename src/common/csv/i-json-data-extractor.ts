export interface IJSONDataExtractor<T, R = T> {
  extract(data: T): { [Property in keyof R]?: string };
}
