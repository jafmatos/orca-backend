import supertest from "supertest";

export const request = supertest(process.env.APP_URL! || "http://localhost:3333/v1");
