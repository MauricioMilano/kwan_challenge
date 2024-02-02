import express from 'express';

const router = express.Router();
import authentication from './authentication';
import tasks from './tasks';
import { PrismaClient } from '@prisma/client';

export default (): express.Router => {
    const client = new PrismaClient()
    authentication(router, client);
    tasks(router, client);
    return router;
}