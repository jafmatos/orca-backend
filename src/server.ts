require("dotenv-expand").expand(require("dotenv").config());

import "express-async-errors";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import https from "https";
import fs from "fs";
import { express_async_errors_middleware } from "./middleware/express_async_errors";
import { router } from "./routes";
import { dataSource } from "./database/data-source";

const app = express();
const port = +process.env.APP_PORT!;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  bodyParser.json({
    // limit: "10mb",
  })
);
app.use(
  cors({
    origin: (_, callback) => {
      callback(null, true);
    },
  })
);

app.use(router);
app.use(express_async_errors_middleware);

const key = fs.readFileSync("ssl/key.pem", "utf-8");
const cert = fs.readFileSync("ssl/cert.pem", "utf-8");
const server = https.createServer({ key, cert }, app);

server.listen(port, async () => {
  try {
    await dataSource.initialize();

    console.log(`App running on ${process.env.APP_URL}`);
  } catch (error) {
    console.log(error);

    process.exit(1);
  }
});
