import { blockDDoS } from "../lib";
import { Request } from "express";
import ddosMiddleware from '../lib';
import { next, request, ResetMock, response, result } from "./utils";

describe('info', () => {

    it('should make request with success', () => {
        ResetMock();
        const middleware = blockDDoS();
        middleware(request, response, next);
        expect(result).toEqual({ status: 200, data: { next: true } });
    });

    it('should block 3th request with success', () => {
        ResetMock();
        const middleware = blockDDoS();
        middleware(request, response, next);
        middleware(request, response, next);
        middleware(request, response, next);
        expect(result).toEqual({ status: 403, data: { error: { message: 'Blocked by proxy. Try again in a moment!' } } });
    });

    it('should allow request for another ip', () => {
        const middleware = ddosMiddleware();
        const req = Object.assign({}, { ...request }, { socket: { remoteAddress: '157.237.150.27' } }) as Request;
        middleware(req, response, next);
        expect(result).toEqual({ status: 200, data: { next: true } });
    })

    it('should throws if provide a time as string', () => {
        const fn = () => blockDDoS({ interval: '900' as any });
        expect(fn).toThrowError('The time interval must be a number');
    });

    it('should throws if provide a time less than 5000ms', () => {
        const fn = () => blockDDoS({ interval: 4000 });
        expect(fn).toThrowError('The time interval must be greater than or equal to 5000ms');
    });

    it('should throws if provide negative', () => {
        const fn = () => blockDDoS({ attempts: -1 });
        expect(fn).toThrowError('The attempts param must be between 0 and 8');
    });

    it('should throws if provide 0', () => {
        const fn = () => blockDDoS({ attempts: 0 });
        expect(fn).toThrowError('The attempts param must be between 0 and 8');
    });

    it('should throws if provide 8', () => {
        const fn = () => blockDDoS({ attempts: 8 });
        expect(fn).toThrowError('The attempts param must be between 0 and 8');
    });

    it('should to be a function', () => {
        const isFn = typeof ddosMiddleware === 'function';
        expect(isFn).toBeTruthy();
    });
});
