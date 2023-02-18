import { NextFunction, Request, Response } from "express";

export const result = { data: {}, status: 400 };

export const request = { socket: { remoteAddress: '::1' }, path: '/index', method: 'GET' } as Request;

export const response = {
    status: function (status: number) {
        return ({
            json: function (data: {}) {
                result.data = data;
                result.status = status;
            }
        });
    }
} as Response;

export const next = function () {
    result.status = 200;
    result.data = { next: true };
} satisfies NextFunction;

export const ResetMock = () => { result.data = {}; result.status = 200; };
