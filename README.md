# block-ddos

A middleware function for a Node.js web application that helps prevent **distributed denial-of-service (DDoS) attacks**. When a client makes a request to the application, the middleware function is called to check if the request is legitimate or not based on the number of requests made within a certain time period.

The function first checks if the request is an `HTTP` request and not for the `/favicon.ico file`. If it is not an **HTTP request** or for the /favicon.ico file, the function passes control to the next middleware function in the chain.

If the request is an HTTP request and not for the /favicon.ico file, the function checks if the client has made too many requests by checking if the client's browser has stored a cookie named `"ddos-blocked-times"` with a value of 20 or more. If the client has made too many requests, the function returns an HTTP 403 error with a JSON object containing an error message.

If the client has not made too many requests, the function creates an instance of a memory store, which stores information about requests made by clients. The function then creates an instance of an Info object, which contains information about the client's request, such as the client's IP address, user agent, and timestamp.

The function generates a hash code for the Info object and checks if the client has made too many requests by calling the CanAccess method of the MemoryStore object. **If the client has made too many requests, the function returns an HTTP 403 error with a JSON object containing an error message**.

If the client has not made too many requests, the function saves the Info object to the MemoryStore object and passes control to the next middleware function in the chain.

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


## Allow retry

You can allow user retry some request before block it. In this example the 3th request for same endpoint from the same ip will be blocked on default interval: `10sec`

```ts

import { blockDDoS } from 'block-ddos';

// attempts must be: 1 - 7. default is 2.
const attempts = 3;

app.use(blockDDoS({ attempts }));

```

---

## Ban IP

If the ip is blocked **twenty (20) times** for the same route in a 10 minutes interval, it will be banned for 10 minutes

---
## Error Payload

The content below is sent to user.

**Status Code 403**

```json

{
  "error": {
    "message": "Blocked by proxy. Try again in a moment!"
  }
}

```
