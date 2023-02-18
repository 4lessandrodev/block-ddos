import { Request } from "express";
import blockDDoS from "../lib";
import { next, request, ResetMock, response, result } from "./utils";

describe('custom errors', () => {
    it('should return success', () => {
        ResetMock();
        const req = Object.assign({}, { ...request }, { socket: { remoteAddress: '60.198.115.122' } }) as Request;
        const middleware = blockDDoS({ error: { result: 'My custom error', isFail: true }, attempts: 1 });
        middleware(req, response, next);
        expect(result).toEqual({ data: { next: true }, status: 200 });
    })

    it('should return custom error', () => {
        ResetMock();
        const req = Object.assign({}, { ...request }, { socket: { remoteAddress: '60.198.115.122' } }) as Request;
        const middleware = blockDDoS({ error: { msg: 'My custom error', isFail: true }, attempts: 1 });
        middleware(req, response, next);
        expect(result).toEqual({ data: { error: { isFail: true, msg: 'My custom error' } }, status: 403 });
    })
});
