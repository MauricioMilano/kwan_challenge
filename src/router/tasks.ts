import express from 'express';

import { PrismaClient } from '@prisma/client';
import { TasksController } from '../controllers/tasks';
import { Authenticate } from '../middleware/auth';
export default (router: express.Router, repository: PrismaClient) => {
    const tasks = new TasksController(repository);
    router.get("/tasks/all", Authenticate)
    router.get("/tasks", Authenticate, tasks.get)
    router.get("/tasks/:task_id", Authenticate, tasks.get)
    router.post("/tasks", Authenticate, tasks.create)
    router.patch("/tasks/:task_id", Authenticate, tasks.perform)
    router.delete("/tasks/:task_id", Authenticate, tasks.delete)

}
