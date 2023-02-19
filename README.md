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

// middleware apply to single route
app.post('/some-route', blockDDoS(), route);

app.use(otherRoutes);

app.listen(3000);

```

## Interval

Determine the interval (ttl) to apply between multiple requests.
The middleware is a singleton instance so different time interval for different routes will not works. the instance keep the same config for all routes.

```ts

import { blockDDoS } from 'block-ddos';

// 30 sec in milliseconds
// default is 10 sec (10000ms), and minimum is 10 sec (10000ms)
const interval = 30000;

app.use(blockDDoS({ interval }));

```

## Customize message

Change the message sent to user

```ts

import { blockDDoS } from 'block-ddos';

const interval = 15000;
const error = "Blocked by block-ddos middleware";

app.use(blockDDoS({ interval, error }));

```


## Allow some retry

You can allow user retry some request before block it. In this example the 3th request for same endpoint from the same ip will be blocked on default interval: `10sec`

```ts

import { blockDDoS } from 'block-ddos';

// attempts must be: 1 - 7. default is 2.
const attempts = 3;

app.use(blockDDoS({ attempts }));

```

## ban IP

If the ip is blocked twenty (20) times for the same route in a 10 minutes interval, it will be banned for 10 minutes
