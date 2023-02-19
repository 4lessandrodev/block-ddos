import { NextFunction, Request, Response } from "express";

export const result = { data: {}, status: 400 };
export const cookies: { [key: string]: any } = {};
export const cookieOptions: { [key: string]: any } = {};

export const request = { 
    headers: { 'x-forwarded-for': '41.125.107.17, 172.20.235.47, 11.204.123.255, 19.203.151.141' }, 
    path: '/index', 
    method: 'GET',
    protocol: 'http',
    cookies: cookies,
    hostname: 'http://localhost'
} as unknown as Request;

export const response = {
    status: function (status: number) {
        return ({
            json: function (data: {}) {
                result.data = data;
                result.status = status;
            }
        });
    },
    cookie: (key: string, value: any, options: any) => {
        cookies[key] = value;
        cookieOptions[key] = options;
     }
} as Response;

export const next = function () {
    result.status = 200;
    result.data = { next: true };
} satisfies NextFunction;

export const ResetMock = () => { result.data = {}; result.status = 200; };
