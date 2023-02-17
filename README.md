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

Applying for a single route.

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

Determine the interval (ttl) to apply between multiple requests.
The middleware is a singleton instance. Do not use different time interval for different routes. Keep the same time interval for all routes.

```ts

import { blockDDoS } from 'block-ddos';

// 30 sec in milliseconds - default is 10 sec (10000ms), and minimum is 5 sec (5000ms)
const interval = 30000;

app.use(blockDDoS(interval));

```

## Customize message

Change the message sent to user

```ts

import { blockDDoS } from 'block-ddos';

const interval = 15000;
const message = "Blocked by block-ddos middleware";

app.use(blockDDoS(interval, message));

```
