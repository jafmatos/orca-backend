require("dotenv").config();

import { initializeDb } from "./database/data-source";
import { userSeeder } from "./database/seeders/UserSeeder";
import { logger } from "./infra/Logger";

export const seed = async () => {
  logger.info("Started seeding");

  try {
    await initializeDb();
    await userSeeder.seed(10);

    logger.info("Finished seeding");

    process.exit(0);
  } catch (error) {
    logger.error("Error while seeding", error);

    process.exit(1);
  }
};

seed();
