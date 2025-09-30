import "reflect-metadata";
import "express-async-errors";

require("dotenv-expand").expand(require("dotenv").config());

import express from "express";
import expressLayouts from "express-ejs-layouts";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import { express_async_errors_middleware } from "./middleware/express_async_errors";
import { router } from "./routes";
import { dataSource } from "./database/data-source";
import { User, UserRoles } from "./database/entities/User.entity";
import { Bcrypt } from "./helpers/Bcrypt";

const app = express();
const port = +process.env.APP_PORT!;

app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layouts/base");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
	bodyParser.json({
		// limit: "10mb",
	})
);
app.use(
	cors({
		origin: (origin, callback) => {
			if (process.env.NODE_ENV === "production") {
				if (!origin) return callback(null, true);

				const allowedDomains = [
					'https://orca-financas.com',
					'http://orca-financas.com',
					'https://www.orca-financas.com',
					'http://www.orca-financas.com'
				];

				if (allowedDomains.includes(origin)) {
					callback(null, true);
				} else {
					callback(new Error("Not allowed by cors"))
				}
			}

			callback(null, true);
		},
	})
);

app.use("/v1", router);
app.use(express_async_errors_middleware);

const server = http.createServer(app);

server.listen(port, async () => {
	try {
		await dataSource.initialize();

		const userRepository = dataSource.getRepository(User)
		const existingSuperUser = await userRepository.findOne({
			where: {
				email: "anselmojose397@gmail.com",

			}
		})

		if (!existingSuperUser) {
			await userRepository.save(userRepository.create({
				role: UserRoles.SuperUser,
				email: process.env.APP_SUPER_USER_EMAIL,
				name: process.env.APP_SUPER_USER_NAME,
				password: Bcrypt.hash(process.env.APP_SUPER_USER_PASSWORD!),
				isEmailConfirmed: true,
				acceptedTermsAt: new Date(),
			}));
		}

		console.log(`App running on ${process.env.APP_URL} in ${process.env.NODE_ENV}`);
	} catch (error) {
		console.log(error);

		process.exit(1);
	}
});
