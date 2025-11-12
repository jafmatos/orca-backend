export type DataProviderFor<T> = {
  [Property in keyof T]?: () => T[Property];
};
