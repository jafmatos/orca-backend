import request from 'supertest';

export const api = () => {
  return request('http://localhost:3333/v1');
};
