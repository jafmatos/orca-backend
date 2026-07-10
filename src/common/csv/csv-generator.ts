import { stringify } from 'csv-stringify';
import { IJSONDataExtractor } from './i-json-data-extractor';

export type CSVGeneratorKeyToPropertyMap<T> = {
  [Property in keyof T]: string;
};

export class CSVGenerator<T = any, R = T> {
  private jsonDataExtractor: IJSONDataExtractor<T, R>;

  constructor(jsonDataExtractor: IJSONDataExtractor<T, R>) {
    this.jsonDataExtractor = jsonDataExtractor;
  }

  generate(map: CSVGeneratorKeyToPropertyMap<Partial<R>>, data: T[]) {
    const extractedData = data.map((item) =>
      this.jsonDataExtractor.extract(item),
    );
    const mappedData = extractedData.map((item) => {
      const mappedItem: { [key: string]: string } = {};

      for (const key in map) {
        const property = map[key as keyof R];

        mappedItem[property as string] = item[key as keyof R] || '';
      }
      return mappedItem;
    });

    return new Promise<string>((resolve, reject) => {
      stringify(mappedData, { header: true, delimiter: ';' }, (err, output) => {
        if (err) {
          return reject(err);
        }
        resolve(output);
      });
    });
  }
}
