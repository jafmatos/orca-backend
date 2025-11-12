export type ProbabilityMapItems<T = any> = {
  [key: number]: T;
};

export class ProbabilityMap<T> {
  private items: ProbabilityMapItems<T>;

  constructor(items: ProbabilityMapItems<T>) {
    this.items = items;
  }

  generate() {
    let highestScore = 0;
    let value: T;

    for (const [probability, itemValue] of Object.entries(this.items)) {
      const score = +probability * Math.random();

      if (score > highestScore) {
        highestScore = score;
        value = itemValue;
      }
    }

    return value!;
  }
}
