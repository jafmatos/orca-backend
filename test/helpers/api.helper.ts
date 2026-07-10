import request from 'supertest';

export const api = () => {
  return request(process.env.TESTING_API_URL!);
};
