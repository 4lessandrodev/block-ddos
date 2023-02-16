import blockDDoS from "@block-ddos";
import { NextFunction, Request, Response } from "express";

describe('info', () => {

    const result = { data: {}, status: 400 };

    const request = { socket: { remoteAddress: '::1' }, path: '/index', method: 'GET' } as Request;

    const response = {
        status: function (status: number) {
            return ({
                json: function (data: {}) {
                    result.data = data;
                    result.status = status;
                }
            });
        }
    } as Response;

    const next = function () {
        result.status = 200;
        result.data = { next: true };
    } satisfies NextFunction;

    const ResetMock = () => { result.data = {}; result.status = 200; };

    it('should make request with success', () => {
        ResetMock();
        const middleware = blockDDoS();
        middleware(request, response, next);
        expect(result).toEqual({ status: 200, data: { next: true } });
    });

    it('should block sec request with success', () => {
        ResetMock();
        const middleware = blockDDoS();
        middleware(request, response, next);
        expect(result).toEqual({ status: 403, data: { message: 'Blocked by proxy. Try again in a moment!' } });
    });

    it('should throws if provide a time as string', () => {
        const fn = () => blockDDoS('9000' as any);
        expect(fn).toThrowError('The time interval must be a number');
    });

    it('should throws if provide a time less than 5000ms', () => {
        const fn = () => blockDDoS(4000);
        expect(fn).toThrowError('The time interval must be greater than or equal to 5000ms');
    });
});
