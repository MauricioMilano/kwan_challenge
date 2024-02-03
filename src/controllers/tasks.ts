import { PrismaClient } from "@prisma/client/extension";
import express, { Response } from "express";
import { Request } from "../models/API/request";
import { Role } from "../models/role";
import e from "express";
import tasks from "router/tasks";
import { permissions_allowed } from "../helpers/auth"
import { APIerror } from "../models/API/error";
import { TASK_PERMISSIONS } from "../config";
import { RabbitMQService } from "services/rabbitmq";
export class TasksController {

    repository: PrismaClient;
    queueCon: RabbitMQService;
    constructor(repository: PrismaClient, queueCon: RabbitMQService) {
        this.repository = repository
        this.queueCon = queueCon
        this.create = this.create.bind(this)
        this.get = this.get.bind(this)
        this.delete = this.delete.bind(this)
        this.perform = this.perform.bind(this)
        this.getAll = this.getAll.bind (this)

    }

    public async create(req: Request | Partial<Request>, res: Response | Partial<Response>
    ) {
        try {
            
            const { user, permissions } = req;
            if (!permissions_allowed(TASK_PERMISSIONS.create, permissions, res)) {
                return
            }
            
            const { name, sumary } = req.body;
            if (!name || !sumary ){ 
                return res.status(422).send(APIerror("Missing body properties")).end()
            }
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
            return res.status(500).send(APIerror("Internal server error")).end()
        }
    }

    public async get(req: Request | Partial<Request>, res: Response | Partial<Response>
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
            return res.status(500).send(APIerror("Internal server error" )).end()
        }
    }
    public async getAll(req: Request | Partial<Request>, res: Response | Partial<Response>
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
            res.status(500).send(APIerror("Internal server error" )).end()
        }
    }

    public async perform(req: Request | Partial<Request>, res: Response | Partial<Response>
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
                return res.status(404).send(APIerror("Task not found" )).end()

            }
            if (task.date_performed) {
                res.status(400).send(APIerror("Task already performed" )).end()
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
            this.queueCon.send( `The tech ${user.name} performed the task ${task.name} on date ${task.date_performed}`)
            res.status(200).json(task).end()
        } catch (error) {
            console.error(error)
            res.status(500).send(APIerror("Internal server error" )).end()
        }
    }

    public async delete(req: Request | Partial<Request>, res: Response | Partial<Response>
    ) {
        try {

            const { user, permissions } = req;
            const { task_id } = req.params

            if (!permissions_allowed(TASK_PERMISSIONS.delete, permissions, res)) {
                return
            }
            let task = await this.repository.tasks.findFirst({ where: {id: task_id}})
            if (!task) {
                res.status(404).send({message: "Task not found"}).end()
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
            return res.status(500).send(APIerror("Internal server error" )).end()
        }
    }
}