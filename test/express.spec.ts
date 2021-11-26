import { assert } from 'chai';
import express from 'express';
import request from 'supertest';

import loadExpress from '../src/infra/express';
import redis from '../src/infra/redis';

describe('Misc route tests', function () {
  it('GET /', function (done) {
    const app = loadExpress(express(), redis);

    request(app)
      .get('/')
      .expect(200)
      .then(() => done())
      .catch((err) => done(err));
  });
});

describe('Authentication route tests', function () {
  const app = loadExpress(express(), redis);

  it('POST /api/v1/authentication/register', function (done) {
    request(app)
      .post('/api/v1/authentication/register')
      .send({
        username: 'kaede',
        password: 'abcdeEF1234579',
        name: 'Kaede Kimura',
        address: 'Tokyo, Japan',
      })
      .expect(201)
      .then((res) => {
        assert.equal(res.body.data.username, 'kaede');
        assert.equal(res.body.data.name, 'Kaede Kimura');

        done();
      })
      .catch((err) => done(err));
  });

  it('POST /api/v1/authentication/login', function (done) {
    request(app)
      .post('/api/v1/authentication/login')
      .send({ username: 'kaede', password: 'abcdeEF1234579' })
      .expect(200)
      .then(() => done())
      .catch((err) => done(err));
  });
});

describe('User route tests', function () {
  it('GET /api/v1/users', function (done) {
    const app = loadExpress(express(), redis);

    request(app)
      .get('/api/v1/users')
      .expect(200)
      .then(() => done())
      .catch((err) => done(err));
  });

  it('GET /api/v1/users/kaede', function (done) {
    const app = loadExpress(express(), redis);

    request(app)
      .get('/api/v1/users/kaede')
      .expect(200)
      .then(() => done())
      .catch((err) => done(err));
  });

  it('POST /api/v1/users', async function () {
    const app = loadExpress(express(), redis);

    const res = await request(app)
      .post('/api/v1/authentication/login')
      .send({ username: 'kaede', password: 'abcdeEF1234579' })
      .expect(200);

    const newUser = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${res.body.token}`)
      .send({
        username: 'sayu',
        password: 'abcdeEF1234579',
        name: 'Sayu Ogiwara',
        address: 'Hokkaido, Japan',
      })
      .expect(201);

    assert.equal(newUser.body.data.username, 'sayu');
    assert.equal(newUser.body.data.name, 'Sayu Ogiwara');
  });

  it('PUT /api/v1/users', async function () {
    const app = loadExpress(express(), redis);

    const res = await request(app)
      .post('/api/v1/authentication/login')
      .send({ username: 'kaede', password: 'abcdeEF1234579' })
      .expect(200);

    const kaede = await request(app).get('/api/v1/users/kaede').expect(200);

    const newUser = await request(app)
      .put(`/api/v1/users/${kaede.body.data.id}`)
      .set('Authorization', `Bearer ${res.body.token}`)
      .send({
        username: 'mai',
        name: 'Mai Sakurajima',
        address: 'Fujisawa, Japan',
      })
      .expect(200);

    assert.equal(newUser.body.data.username, 'mai');
    assert.equal(newUser.body.data.name, 'Mai Sakurajima');
    assert.equal(newUser.body.data.address, 'Fujisawa, Japan');
  });

  it('DELETE /api/v1/users', async function () {
    const app = loadExpress(express(), redis);

    const res = await request(app)
      .post('/api/v1/authentication/login')
      .send({ username: 'mai', password: 'abcdeEF1234579' })
      .expect(200);

    const mai = await request(app).get('/api/v1/users/mai').expect(200);

    await request(app)
      .delete(`/api/v1/users/${mai.body.data.id}`)
      .set('Authorization', `Bearer ${res.body.token}`)
      .expect(204);
  });

  it('should shut down gracefully', async function () {
    await redis.quit();
  });
});
