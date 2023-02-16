import { fnDDoS } from "./types";
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
export declare const blockDDoS: fnDDoS;
export default blockDDoS;
