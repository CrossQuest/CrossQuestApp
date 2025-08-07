# Project Name

> Project Mission Statement

## Team

  - teamMember: **Scrum Master, Developer**
  - teamMember: **Developer**
  - teamMember: **Developer**

## Table of Contents
- [Getting Started](#getting-started)
  - [Build and Start Commands](#build-and-start-commands)
  - [Technologies Used](#technologies-used)
- [Project Proposal](#project-proposal)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Style Guide](#style-guide)

## Getting Started

Before you can actually start building, you need to create a database and configure your server's environment variables to connect with it.

- Create a database with a name of your choice.
- In the `server/` folder, copy the `.env.template` and name it `.env`.
- Update the `.env` variables to match your Postgres database information (username, password, database name)
- Replace the `SESSION_SECRET` value with your own random string. This is used to encrypt the cookie's `userId` value.
  - Use a tool like [https://randomkeygen.com/](https://randomkeygen.com/) to help generate the secret.
- Your `.env` file should look something like this:

```sh
# Replace these variables with your Postgres server information
# These values are used by knexfile.js to connect to your postgres server
PG_HOST='127.0.0.1'
PG_PORT=5432
PG_USER='itsamemario'
PG_PASS='12345'
PG_DB='my_react_express_auth_database'

# Replace session secret with your own random string!
# This is used by handleCookieSessions to hash your cookie data 
SESSION_SECRET='db8c3cffebb2159b46ee38ded600f437ee080f8605510ee360758f6976866e00d603d9b3399341b0cd37dfb8e599fff3'

# When you deploy your database on render, this string can be used to test SQL queries to the deployed database.
# Leave this value blank until you deploy your database.
PG_CONNECTION_STRING=''
```

### Build and Start Commands

From within the root directory, run the following commands to install dependencies and run the project locally:

```sh
# Build Command — install dependencies, build the static assets, and run migrations/seeds
cd frontend && npm i && npm run build && cd ../server && npm i && npm run migrate && npm run seed && cd ..

# Start Command
cd server && npm start
```

## Technologies Used

- Node
- Express
- Postgresql
- React
- Knex
- etc...

## Backend Development Guide

This section provides a step-by-step guide to developing the backend of this project. Each step includes code snippets, explanations, and the exact file or folder to work in.

### 1. Project Structure Overview

- `server/index.js`: Main entry point for the backend server.
- `server/controllers/`: Route handler logic (business logic for each endpoint).
- `server/models/`: Database interaction logic (e.g., User.js).
- `server/middleware/`: Custom Express middleware (e.g., authentication, logging).
- `server/db/`: Database migrations, seeds, and configuration.

### 2. Add a New API Route

**Purpose:** Handle a new type of request (e.g., create a new resource).

**Where:** `server/index.js` (for route registration), `server/controllers/` (for logic).

**Example:** Add a new GET endpoint for `/api/example`.

```js
// In server/controllers/exampleController.js
exports.getExample = (req, res) => {
  res.json({ message: "Example endpoint works!" });
};
```

```js
// In server/index.js
const exampleController = require("./controllers/exampleController");
app.get("/api/example", exampleController.getExample);
```

### 3. Create or Update a Controller

**Purpose:** Add business logic for a route (e.g., user registration, fetching data).

**Where:** `server/controllers/`

**Example:** Add a function to `userControllers.js`:

```js
// In server/controllers/userControllers.js
exports.getProfile = (req, res) => {
  // Your logic here
  res.json({ user: req.user });
};
```

### 4. Add or Update a Model

**Purpose:** Interact with the database (CRUD operations).

**Where:** `server/models/`

**Example:** Add a function to `User.js`:

```js
// In server/models/User.js
const knex = require("../db/knex");
exports.findByEmail = (email) => {
  return knex("users").where({ email }).first();
};
```

### 5. Create Middleware

**Purpose:** Add reusable logic for requests (e.g., authentication, logging).

**Where:** `server/middleware/`

**Example:** Log every request:

```js
// In server/middleware/logRequests.js
module.exports = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};
```

Add to `index.js`:
```js
const logRequests = require("./middleware/logRequests");
app.use(logRequests);
```

### 6. Database Migrations

**Purpose:** Change the database schema (add tables, columns, etc.).

**Where:** `server/db/migrations/`

**Example:** Create a migration:

```sh
cd server
npm run migrate:make -- create_example_table
```

Edit the generated file in `server/db/migrations/`:
```js
exports.up = function(knex) {
  return knex.schema.createTable('example', function(table) {
    table.increments('id').primary();
    table.string('name');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTable('example');
};
```

Run migrations:
```sh
npm run migrate
```

### 7. Database Seeding

**Purpose:** Populate the database with initial data.

**Where:** `server/db/seeds/`

**Example:** Create a seed file:

```sh
npm run seed:make -- example_seed
```

Edit the generated file in `server/db/seeds/`:
```js
exports.seed = function(knex) {
  return knex('example').del()
    .then(function () {
      return knex('example').insert([
        {id: 1, name: 'Sample'}
      ]);
    });
};
```

Run seeds:
```sh
npm run seed
```

### 8. Environment Variables

**Purpose:** Store sensitive information and configuration.

**Where:** `server/.env` (copy from `.env.template`)

**Example:**
```
PG_HOST=localhost
PG_PORT=5432
PG_USER=youruser
PG_PASS=yourpass
PG_DB=yourdb
SESSION_SECRET=your_secret
```

---

This guide should help you develop and extend the backend with clear steps and file locations. For more details, see the code comments and existing files in each directory.

## Project Proposal

See [PROPOSAL.md](PROPOSAL.md) for more details on the project proposal.

## Roadmap

View the project roadmap [here](LINK_TO_PROJECTS_TAB).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Style Guide

This project adheres to the [Airbnb Style Guide](https://github.com/airbnb/javascript).
