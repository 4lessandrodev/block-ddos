
import { Request } from 'express';
import ddosMiddleware from '../lib';
import { next, request, ResetMock, response, result } from "./utils";

describe('info', () => {


    it('should allow 7 requests with success', () => {
            ResetMock();
            const req = Object.assign({}, { ...request }, { socket: { remoteAddress: '160.236.150.247' } }) as Request;
            const middleware = ddosMiddleware({ attempts: 7 });
            middleware(req, response, next);
            middleware(req, response, next);
            middleware(req, response, next);
            middleware(req, response, next);
            middleware(req, response, next);
            middleware(req, response, next);
            middleware(req, response, next);
            expect(result).toEqual({ status: 200, data: { next: true } });
    });

});
