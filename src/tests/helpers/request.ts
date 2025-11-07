import supertest from "supertest";

export const request = supertest("http://backend-app-test:3333/v1");
