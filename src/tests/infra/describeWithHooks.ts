import jest, { afterAll, afterEach, beforeAll, beforeEach, describe } from "@jest/globals";

export function describeWithHooks(blockName: string, blockFn: () => void) {
  return describe(blockName, () => {
    beforeAll(() => {
      // console.log("Default before all");
    });

    afterAll(() => {
      // console.log("Default after all");
    });

    beforeEach(() => {
      // console.log("Default before each");
    });

    afterEach(() => {
      // console.log("Default after each");
    });

    blockFn();
  });
}
