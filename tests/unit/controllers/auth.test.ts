import express from "express";
import { PrismaClient } from "@prisma/client";
import { JWTHelper } from "../../../src/helpers/jwt";
import { authentication, random } from "../../../src/helpers/auth";
import { APIerror } from "../../../src/models/API/error";
import { AuthController } from "../../../src/controllers/authentication";
import { User } from "../../../src/models/user";
import { Auth } from "../../../src/models/auth";

jest.mock("@prisma/client", () => {
    const mockPrismaClient = {
        users: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        role: {
            findFirst: jest.fn(),
        },
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});

jest.mock("../../../src/helpers/jwt", () => ({
    JWTHelper: {
        sign: jest.fn(),
    },
}));

jest.mock("../../../src/helpers/auth", () => ({
    authentication: jest.fn(),
    random: jest.fn(),
}));

const mockAuth: Partial<Auth> =  {
    password: "hashedPassword",
    salt: "randomSalt",
}
const mockUser :Partial<User> = {
    name: "user",
    email: "user@example.com",
    role: {
        name: "admin",
        permissions: "read;write;delete",
    },
    auth: mockAuth,
    token: "mockToken",
};

const mockRequest: Partial<express.Request> = {}

const mockResponse: Partial<express.Response> = {
    sendStatus: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
};

const client = new PrismaClient();
const authController = new AuthController(client);

describe("AuthController class", () => {
    afterEach(()=>{
        jest.clearAllMocks()
    })
    describe("register method", () => {
        test("should create a new user and return a 200 response with the user and token", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
                username: mockUser.name,
                role: mockUser?.role?.name,
            };

            (client.users.findFirst as jest.Mock).mockResolvedValue(null);
            (client.role.findFirst as jest.Mock).mockResolvedValue(mockUser.role);
            (client.users.create as jest.Mock).mockResolvedValue(mockUser);
            (authentication as jest.Mock).mockReturnValue(mockUser.auth?.password);
            (random as jest.Mock).mockReturnValue(mockUser.auth?.salt);
            (JWTHelper.sign as jest.Mock).mockReturnValue(mockUser.token);

            await authController.register(mockRequest, mockResponse);

            expect(client.users.findFirst).toHaveBeenCalledWith({
                where: { email: mockUser.email },
            });
            expect(client.role.findFirst).toHaveBeenCalledWith({
                where: { name: mockUser.role?.name },
            });
            expect(client.users.create).toHaveBeenCalledWith({
                data: {
                    name: mockUser.name,
                    email: mockUser.email,
                    auth: {
                        create: {
                            password: mockUser.auth?.password,
                            salt: mockUser.auth?.salt,
                        },
                    },
                    role: {
                        connect: {
                            id: mockUser.role?.id,
                        },
                    },
                },
            });
            expect(authentication).toHaveBeenCalledWith(
                mockUser.auth?.salt,
                mockUser.auth?.password
            );
            expect(random).toHaveBeenCalled();
            expect(JWTHelper.sign).toHaveBeenCalledWith(mockUser);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith(mockUser);
            expect(mockResponse.end).toHaveBeenCalled();

        });

        test("should return a 422 response with an error message if the request body is missing some properties", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
                username: mockUser.name,
            };

            await authController.register(mockRequest, mockResponse);

            expect(client.users.findFirst).not.toHaveBeenCalled();
            expect(client.role.findFirst).not.toHaveBeenCalled();
            expect(client.users.create).not.toHaveBeenCalled();
            expect(authentication).not.toHaveBeenCalled();
            expect(random).not.toHaveBeenCalled();
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(422);
            expect(mockResponse.send).toHaveBeenCalledWith(
                APIerror("Missing body properties")
            );
            expect(mockResponse.end).toHaveBeenCalled();
        });

        test("should return a 400 response with an error message if the user already exists", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
                username: mockUser.name,
                role: mockUser.role?.name,
            };
            (client.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
            await authController.register(mockRequest, mockResponse);
            expect(client.users.findFirst).toHaveBeenCalledWith({
                where: { email: mockUser.email },
            });
            expect(client.role.findFirst).not.toHaveBeenCalled();
            expect(client.users.create).not.toHaveBeenCalled();
            expect(authentication).not.toHaveBeenCalled();
            expect(random).not.toHaveBeenCalled();
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith(
                APIerror("User already exists")
            );
            expect(mockResponse.end).toHaveBeenCalled();
        });

        test("should return a 400 response with an error message if there is an error creating the JWT", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
                username: mockUser.name,
                role: mockUser.role?.name,
            };
            (client.users.findFirst as jest.Mock).mockResolvedValue(null);
            (client.role.findFirst as jest.Mock).mockResolvedValue(mockUser.role);
            (client.users.create as jest.Mock).mockResolvedValue(mockUser);
            (authentication as jest.Mock).mockReturnValue(mockUser.auth?.password);
            (random as jest.Mock).mockReturnValue(mockUser.auth?.salt);
            const mockError = new Error("JWT error");
            (JWTHelper.sign as jest.Mock).mockImplementation(() => {
                throw mockError;
            });
            await authController.register(mockRequest, mockResponse);
            expect(client.users.findFirst).toHaveBeenCalledWith({
                where: { email: mockUser.email },
            });
            expect(client.role.findFirst).toHaveBeenCalledWith({
                where: { name: mockUser.role?.name },
            });
            expect(client.users.create).toHaveBeenCalledWith({
                data: {
                    name: mockUser.name,
                    email: mockUser.email,
                    auth: {
                        create: {
                            password: mockUser.auth?.password,
                            salt: mockUser.auth?.salt,
                        },
                    },
                    role: {
                        connect: {
                            id: mockUser.role?.id,
                        },
                    },
                },
            });
            expect(authentication).toHaveBeenCalledWith(
                mockUser.auth?.salt,
                mockUser.auth?.password
            );
            expect(random).toHaveBeenCalled();
            expect(JWTHelper.sign).toHaveBeenCalledWith(mockUser);
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.send).toHaveBeenCalledWith(
                APIerror("Error creating jwt ")
            );
            expect(mockResponse.end).toHaveBeenCalled();
        });
        test("should return a 400 response if there is any other error", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
                username: mockUser.name,
                role: mockUser.role?.name,
            };
            const mockError = new Error("Generic error");
            (client.users.findFirst as jest.Mock).mockRejectedValue(mockError);
            await authController.register(mockRequest, mockResponse);
            expect(client.users.findFirst).toHaveBeenCalledWith({
                where: { email: mockUser.email },
            });
            expect(client.role.findFirst).not.toHaveBeenCalled();
            expect(client.users.create).not.toHaveBeenCalled();
            expect(authentication).not.toHaveBeenCalled();
            expect(random).not.toHaveBeenCalled();
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
        });
    });

    describe("login method", () => {
        test("should find the user and return a 200 response with the user and token", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
            };
            (client.users.findFirst as jest.Mock).mockResolvedValue(mockUser);
            (authentication as jest.Mock).mockReturnValue(mockUser.auth?.password);
            (JWTHelper.sign as jest.Mock).mockReturnValue(mockUser.token);

            await authController.login(mockRequest, mockResponse);
            expect(client.users.findFirst).toHaveBeenCalledWith({
                where: { email: mockUser.email },
                include: {
                    auth: true,
                    role: true,
                },
            });
            expect(authentication).toHaveBeenCalledWith(
                mockAuth.salt,
                mockAuth.password
            );
            expect(JWTHelper.sign).toHaveBeenCalledWith(mockUser);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith({
                id: mockUser.id,
                name: mockUser.name,
                email: mockUser.email,
                role: mockUser.role,
                token: mockUser.token,
            });
            expect(mockResponse.end).toHaveBeenCalled();
        });

        test("should return a 400 response if the request body is missing some properties", async () => {
            mockRequest.body = {
                email: mockUser.email,
            };

            await authController.login(mockRequest, mockResponse);

            expect(client.users.findFirst).not.toHaveBeenCalled();
            expect(authentication).not.toHaveBeenCalled();
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
            
        });

        test("should return a 400 response if the user does not exist", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
            };
            jest.clearAllMocks();
            (client.users.findFirst as jest.Mock).mockResolvedValue(null);

            await authController.login(mockRequest, mockResponse);
            expect(authentication).not.toHaveBeenCalled();
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
        });

        test("should return a 401 response if the password is incorrect", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: "other_pass",
            };
            mockUser.auth = mockAuth;
            (client.users.findFirst as jest.Mock).mockResolvedValue(mockUser);

            (authentication as jest.Mock).mockReturnValue("");

            await authController.login(mockRequest, mockResponse);
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
        });

        test("should return a 400 response if there is any other error", async () => {
            mockRequest.body = {
                email: mockUser.email,
                password: mockUser.auth?.password,
            };
            const mockError = new Error("Generic error");
            (client.users.findFirst as jest.Mock).mockRejectedValue(mockError);

            await authController.login(mockRequest, mockResponse);


            expect(authentication).not.toHaveBeenCalled();
            expect(JWTHelper.sign).not.toHaveBeenCalled();
            expect(mockResponse.sendStatus).toHaveBeenCalledWith(400);
        });
    });
});
