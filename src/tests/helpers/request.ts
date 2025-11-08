import supertest from "supertest";

export const request = supertest(process.env.APP_URL!);
