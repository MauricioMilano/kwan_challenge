import express from 'express';

import { AuthController } from '../controllers/authentication';
import { PrismaClient } from '@prisma/client';

export default (router: express.Router, repository:PrismaClient) => {
    const authController = new AuthController(repository)
    router.post("/auth/register", authController.register)
    router.post("/auth/login", authController.login)

}
