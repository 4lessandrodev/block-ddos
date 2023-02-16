import { NextFunction, Request, Response } from "express";

export interface Data {
	hash: string;
	expiresAt: number;
	ip: string;
}

export type Payload = Response extends {} ? Response<any, Record<string, any>> | void : any;
export type Middleware = (req: Requests, res: Responses, next: NextFunctions) => Payload;
export type Requests = Request extends {} ? Request : any;
export type Responses = Response extends {} ? Response : any;
export type NextFunctions = NextFunction extends {} ? NextFunction : any;
/**
 * @description Middleware to block multiple request to a same route for a same ip.
 * @param interval time to expires in milliseconds.
 * @param message error message as string.
 * @returns Middleware function.
 *
 * @default interval `10000` = `10 sec`
 * @default message `Blocked by proxy. Try again in a moment!`
 * @throws if provide interval as not a number
 * @throws if provide interval less than 5000ms or 5 sec
 */
export type fnDDoS = (interval?: number, message?: string) => Middleware;
