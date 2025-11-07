import supertest from "supertest";

export const request = supertest("http://localhost:3333/v1");
