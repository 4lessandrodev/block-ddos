import { Request } from "express";
import blockDDoS from "../lib";
import { next, request, ResetMock, response, result } from "./utils";

describe('custom errors', () => {
    it('should return success', () => {
        ResetMock();
        const req = Object.assign({}, { ...request }, { headers: { 'x-forwarded-for': '60.198.115.122' } }) as unknown as Request;
        const middleware = blockDDoS({ error: { result: 'My custom error', isFail: true }, attempts: 1 });
        middleware(req, response, next);
        expect(result).toEqual({ data: { next: true }, status: 200 });
    })

    it('should return custom error', () => {
        ResetMock();
        const req = Object.assign({}, { ...request }, { headers: { 'x-forwarded-for': '41.127.107.18' } }) as unknown as Request;
        const middleware = blockDDoS({ error: { msg: 'My custom error', isFail: true }, attempts: 1 });
        middleware(req, response, next);
        middleware(req, response, next);
        expect(result).toEqual({ data: { error: { isFail: true, msg: 'My custom error' } }, status: 403 });
    })

    it('should block by cookies', () => {
        ResetMock();
        const req = Object.assign({}, { ...request, cookies: { 'ddos-blocked-times': 7 } }, { headers: { 'x-forwarded-for': '77.11.107.51' } }) as unknown as Request;
        const middleware = blockDDoS({ error: { msg: 'My custom error', isFail: true }, attempts: 1 });
        middleware(req, response, next);
        expect(result).toEqual({ data: { error: { isFail: true, msg: 'My custom error' } }, status: 403 });
        expect(req).toMatchSnapshot();
    })

    it('should block by secure cookies', () => {
        ResetMock();
        const req = Object.assign({}, { ...request, cookies: { 'ddos-blocked-times': 9 }, protocol: 'https', }, { headers: { 'x-forwarded-for': '77.11.107.51' } }) as unknown as Request;
        const middleware = blockDDoS({ error: { msg: 'My custom error', isFail: true }, attempts: 1 });
        middleware(req, response, next);
        expect(result).toEqual({ data: { error: { isFail: true, msg: 'My custom error' } }, status: 403 });
        expect(req).toMatchSnapshot();
    })
});
