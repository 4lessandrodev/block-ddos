import { NextFunction, Request, Response } from "express";

export interface Data {
	hash: string;
	expiresAt: number;
	attempts: number;
	ttl: number;
	Increment(): Readonly<Data>;
}

export type Payload = Response extends {} ? Response<any, Record<string, any>> | void : any;
export type Middleware = (req: Requests, res: Responses, next: NextFunctions) => Payload;
export type Requests = Request extends {} ? Request : any;
export type Responses = Response extends {} ? Response : any;
export type NextFunctions = NextFunction extends {} ? NextFunction : any;
export type Get = { data: Readonly<Data>; index: number; } | null;

/**
 * @param param is Object:
 * @param interval time interval between requests in milliseconds.
 * @param error Object or String. data to be sent to user in response when error.
 * @param attempts number of attempts allowed before blocking next request. 1 - 10.
 * @returns Middleware function.
 *
 * @default interval `10000` = `10 sec`
 * @default error { message: `Blocked by proxy. Try again in a moment!` }
 * @default attempts 3
 * @throws if provide interval as not a number
 * @throws if provide interval less than 10000ms or 10 sec
 * @throws if provide attempts less than 1 or greater than 7.
 */
export interface Params {
	interval?: number;
	error?: string | {};
	attempts?: number;
}
