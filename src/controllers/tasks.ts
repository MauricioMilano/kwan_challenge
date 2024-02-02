import { PrismaClient } from "@prisma/client/extension";
import express, { Response } from "express";
import { Request } from "../models/API/request";
import { Role } from "../models/role";
import e from "express";
import tasks from "router/tasks";
import { permissions_allowed } from "../helpers/auth"
import { APIerror } from "../models/API/error";
import { TASK_PERMISSIONS } from "../config";
export class TasksController {

    repository: PrismaClient;

    constructor(repository: PrismaClient) {
        this.repository = repository
        this.create = this.create.bind(this)
        this.get = this.get.bind(this)
        this.delete = this.delete.bind(this)
        this.perform = this.perform.bind(this)
        this.getAll = this.getAll.bind (this)

    }

    public async create(req: Request, res: Response
    ) {
        try {
            
            const { user, permissions } = req;

            if (!permissions_allowed(TASK_PERMISSIONS.create, permissions, res)) {
                return
            }

            const { name, sumary } = req.body;
            const task = await this.repository.tasks.create({
                data: {
                    name: name,
                    sumary: sumary,
                    owner: {
                        connect: {
                            id: user.id
                        }
                    }
                }
            })

            res.status(200).json(task).end()
        } catch (error) {
            console.error(error)
            res.status(500).send(APIerror("Internal server error"))
        }
    }

    public async get(req: Request, res: Response
    ) {
        try {
            const { user, permissions } = req;
            const { page, limit } = req.query;
            const pageNumber = parseInt(page as string) || 1;
            const pageSize = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * pageSize;
            if (!permissions_allowed(TASK_PERMISSIONS.readMy, permissions, res)) {
                return
            }

            const tasks = await this.repository.tasks.findMany({
                where: {
                    user_id: user.id
                },
                orderBy: {
                    id: "asc",
                },
                skip: skip,
                take: pageSize,
            });

            res.status(200).json(tasks).end()

        } catch (error) {
            console.error(error)
            res.status(500).send(APIerror("Internal server error" ))
        }
    }
    public async getAll(req: Request, res: Response
    ) {
        try {
            const { permissions } = req;
            const { page, limit } = req.query;
            const pageNumber = parseInt(page as string) || 1;
            const pageSize = parseInt(limit as string) || 10;
            const skip = (pageNumber - 1) * pageSize;
            if (!permissions_allowed(TASK_PERMISSIONS.readAll, permissions, res)) {
                return
            }

            const tasks = await this.repository.tasks.findMany({
                where: {
},
                orderBy: {
                    id: "asc",
                },
                include:{
                    owner:true
                },
                skip: skip,
                take: pageSize,
            });

            res.status(200).json(tasks).end()

        } catch (error) {
            console.error(error)
            res.status(500).send(APIerror("Internal server error" ))
        }
    }

    public async perform(req: Request, res: Response
    ) {
        try {
            const { user, permissions } = req;
            const { task_id } = req.params

            if (!permissions_allowed(TASK_PERMISSIONS.update, permissions, res)) {
                return
            }
            let task = await this.repository.tasks.findFirst({
                where: { id: task_id, user_id: user.id }, include: {
                    owner: true
                }
            })
            if (!task) {
                res.status(404).send(APIerror("Task not found" ))

                return
            }
            if (task.date_performed) {
                res.status(400).send(APIerror("Task already performed" ))
                return
            }
            task = await this.repository.tasks.update({
                where: {
                    id: task_id
                },
                data: {
                    date_performed: new Date()
                }
            });

            res.status(200).json(task).end()
        } catch (error) {
            console.error(error)
            res.status(500).send(APIerror("Internal server error" ))
        }
    }

    public async delete(req: Request, res: Response
    ) {
        try {

            const { user, permissions } = req;
            const { task_id } = req.params

            if (!permissions_allowed(TASK_PERMISSIONS.delete, permissions, res)) {
                return
            }
            let task = await this.repository.tasks.findFirst({ where: {id: task_id}})
            if (!task) {
                res.status(404).send({message: "Task Not found"})
                return
            }
            task = await this.repository.tasks.delete({
                where: {
                    id: task_id
                },
            });
            res.status(200).json(task).end()
        } catch (error) {
            console.error(error)
            res.status(500).send(APIerror("Internal server error" ))
        }
    }
}