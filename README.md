# block-ddos

Lib to block multiple request for a route in a short interval from same ip addr.

---

## Install

install using yarn

```sh

$ yarn add block-ddos

```

install using npm

```sh

$ npm install block-ddos

```

## How to use it

Apply to all routes

```ts

import express from 'express';
import { blockDDoS } from 'block-ddos';

const app = express();
app.use(express.json());

// middleware for all routes
app.use(blockDDoS());

app.use(myRoutes);

app.listen(3000);

```

## Single route

Applying for a single route

```ts

import express from 'express';
import { blockDDoS } from 'block-ddos';

const app = express();
app.use(express.json());

// middleware apply to one route
app.post('/some-route', blockDDoS(), route);

app.use(otherRoutes);

app.listen(3000);

```

## Interval

Determine the interval (ttl) to apply between multiple requests

```ts

import { blockDDoS } from 'block-ddos';

// 30 sec in milliseconds - default is 15 sec
const interval = 30000;

blockDDoS(interval);

```
