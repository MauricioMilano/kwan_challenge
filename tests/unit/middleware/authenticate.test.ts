import express from "express";
import { JWTHelper } from "../../../src/helpers/jwt";
import { User } from "../../../src/models/user";
import { Request } from "../../../src/models/API/request";
import { Authenticate } from "../../../src/middlewares/auth";

const mockUser: Partial<User> = {
    id: "1",
    name: "user",
    email: "user@example.com",
    role: {
        name: "admin",
        permissions: "read;write;delete"
    }
}

jest.mock("../../../src/helpers/jwt", () => ({

    JWTHelper: {
        verify: jest.fn()
    },

}));
const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFsaWNlIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsInBhc3N3b3JkIjoiMTIzNDU2Iiwicm9sZSI6eyJpZCI6MSwibmFtZSI6ImFkbWluIiwicGVybWlzc2lvbnMiOiJyZWFkO3dyaXRlO2RlbGV0ZSJ9LCJpYXQiOjE2MTIzNDU2NzN9.4m9Q6xjT8QYgFjzXg0s1PQy0fZxjLAQ8iZrUfD6wqgM";

let mockRequest: Partial<Request> = {
    headers: {
        authorization: `Bearer ${mockToken}`,
    },
    body: {
        email: "emai@test.com",
        password: "!@3231@#!2",
        username: "user_test",
        role: "role_name"
    }
}

const mockResponse: Partial<express.Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
};

const mockNext = jest.fn();

describe("Authenticate middleware", () => {
    test("should send a 401 response if the authorization header is missing", () => {
        let voidRequest: Partial<Request> = {
            headers: {
                authorization: "",
            }
        };

        Authenticate(voidRequest, mockResponse, mockNext);

        expect(JWTHelper.verify).not.toHaveBeenCalled();
        expect(voidRequest.user).toBeUndefined();
        expect(voidRequest.permissions).toBeUndefined();
        expect(mockNext).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({
            message: "Authorization header is required and must be in the format 'Bearer <token>'",
        });
        (JWTHelper.verify as jest.Mock).mockReset();

    });
    test("should call next if the authorization header is valid", () => {
        (JWTHelper.verify as jest.Mock).mockReset();
        (JWTHelper.verify as jest.Mock).mockReturnValue(mockUser);
        (mockResponse.status as jest.Mock).mockReset();
        (mockResponse.json as jest.Mock).mockReset();
        Authenticate(mockRequest, mockResponse, mockNext);

        expect(JWTHelper.verify).toHaveBeenCalledWith(mockToken);
        expect(mockRequest.user).toEqual(mockUser);
        expect(mockRequest.permissions).toEqual(
            mockUser.role?.permissions?.split(";")
        );
        expect(mockNext).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.json).not.toHaveBeenCalled();
       

    });

});
