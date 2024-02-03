import express from 'express';

const router = express.Router();
import authentication from './authentication';
import tasks from './tasks';
import { PrismaClient } from '@prisma/client';
import init from "../boot/initdb"
import { RabbitMQService } from 'services/rabbitmq';
export default (queue: RabbitMQService): express.Router => {
    const client = new PrismaClient()
    init(client)
    authentication(router, client);
    tasks(router, client, queue);
    return router;
}