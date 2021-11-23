# Express Secure Auth

Simulation of my way to solve broken authentication problems with stateful JWT (RFC 7519), hashed passwords, and Redis cache.

Complete with DI, 3 Layer Architecture, integration tests and many other clean code encouragements.

As a part of the experiment, we will use a sample API in order to simulate a real use-case.

## API

The API itself is pretty straightforward and divided into several user stories.

- A user should be able to register and login.
- A logged in user should be able to perform CRUD operations on any other users.
- A non logged user should be able to get all data of users, and get a single data of a user.
- A user can only access sensitive endpoints limited by rate limiters.
- A user can access general endpoints limited by rate limiters.

## Authentication Flow

### Login

![Login Flowchart](./assets/login-flow.png)

### Middleware

![Middleware Flowchart](./assets/middleware-flow.png)

## Prerequisites

For production, you just need Docker and a Linux distribution (to run integration tests). You also need `jq` to run said tests.

For development, you need:

- [Docker](https://www.docker.com/)
- [Node.js 16+](https://nodejs.org/en/)
- [Redis](https://redis.io/)

## Database

Redis is used for this experiment.

- `users` is a set to keep track of all users.
- `user:{id}` is a hash to store the data of a user.
- `username-uid` is a hash to keep track of unique keys - a linkage between `username` and `userId`.
- `sess:{sessionKey}` is a key value type in order to keep track of sessions. Key is a randomly generated session key, and the value is the user identification (user ID). Has an expiry time of 24 hours, same as the expiry time of the JWT.

## Features

- Simple API: registration, logging in, CRUD operations on users.
- Complete with general SE practices: error handling, graceful shutdown, code documentation, clean architecture, etc.
- Secure API that checks for almost all errors and handles them accordingly.
- API will always validate inputs from the request body if applicable.
- A simple RBAC: a logged in user can perform create, update, and delete operations.
- Stateful JWT to make it a replacement for ordinary session tokens.
- 3 Layer Architecture: Routers (include Validations), Services, Data Accesses.
- Dependency injection is here.
- Integration tested with `curl`, `jq`, `mocha`, `nyc`, and Shell.
- Fully documented with JSDoc.
- Dockerized for quick setup (secure, non-root Docker user).

## Development

- To develop in this repository, please clone the repository first.

```bash
git clone git@github.com:lauslim12/express-secure-auth.git
```

- Install the repository.

```bash
yarn --frozen-lockfile
```

- Turn on your Redis (preferably in terminal 2), as you're going to need it. You Redis's address has to be in `localhost:6379` (default).

```bash
# installed variant
redis-cli

# docker variant
docker run -p 6379:6379 redis:latest
```

- You may set several environment variables if you want to test the password encryption algorithm with the other one. Supported values for password hash: `bcrypt` or `sha512`.

```bash
export JWT_SECRET=randompass # you need to set this one
export PASSWORD_HASH=bcrypt # you can choose 'bcrypt' or 'sha512'
export PASSWORD_SALT=randomsalt # you have to define this if you're using 'sha512'
```

- As a note, if you change algorithms (from `sha512` to `bcrypt` for example), you need to clear your Redis database first (so there would be no mismatched hashes).

```bash
# make sure you are in redis
flushdb
```

- Run the application in development mode.

```bash
yarn dev
```

## Tests

There are three ways to run tests in this application.

- First way: use Docker (as described in the next section) to run the whole app and the tests.

- Second way: use a 'real' Redis, and then run the following command:

```bash
# don't forget to flush your Redis first
flushdb

# then you can run integration tests
yarn integration-test
```

- Third way: You can manually test by using `curl`, Postman, and the like in order to get to know the API responses and request requirements.

## Production

The application is meant to be run with Docker.

- Check out all environment variables as above. You may set them instantly at the `docker-compose.yml` file or you can use the `export` keyword. Using the default values are not so bad either.

- Bring the app to live by this command:

```bash
docker-compose up -d --build
```

- To run integration tests:

```bash
sh scripts/test.sh
```

- To stop the app and remove any leftovers:

```bash
docker-compose rm -v --force --stop
docker image rm express-secure-auth:latest
```

## Results

From this experiment, I conclude:

- JSON Web Tokens can be used as an alternative towards a normal session token for _stateful_ authentication.
- `sha512` is much faster than `bcrypt`, but `bcrypt` is quantum-safe and uses modified key algorithms that is cryptographically secure.
- Checking all JSON Web Tokens's claims (`iat`, `nbf`, `sub`, `iss`, `aud`, `jti`, even extra payload like `sess` in this experiment) can be an effective deterrent for an attacker. Creating a valid JWT token from nothingness is already a hard task by itself. I believe this is somewhat safer than ordinary sessions.
- Forcing a user to login again after they have changed passwords seemed like a good security measure - also a good choice to refresh tokens.
- From storage standpoint, `sess:*` key-value pairs will probably not cause any problems as it has a TTL of 24 hours. After that, it's gone.
- Using rate limiters is a good deterrent for an attacker.
- Redis is fast and definitely a good choice for authentication processes. Even if used as an ordinary database, Redis is still excellent in terms of data structure (tidiness of the data) and performance.

## Further Experiments

- Try to explore more password algorithms.
- Create more unit tests.

## References

- [RFC 7519 (JSON Web Tokens)](https://datatracker.ietf.org/doc/html/rfc7519)
- Other online documentations.
