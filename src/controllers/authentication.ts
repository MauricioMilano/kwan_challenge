import express from "express";
import { PrismaClient } from "@prisma/client";
import { JWTHelper } from "../helpers/jwt";
import { authentication, random } from "../helpers/auth";
import { APIerror } from "../models/API/error";
import { User } from "models/user";


export class AuthController {
    
    repository:PrismaClient;

    constructor(repository: PrismaClient){
        this.repository = repository
        this.register = this.register.bind (this)
        this.login = this.login.bind (this)
    }

    async register  (req: express.Request | Partial<express.Request>, res: express.Response | Partial<express.Response>) {
        try {
            const { email, password, username, role } = req.body;
    
            if (!email || !password || !username || !role) {
                return res.status(422).send(APIerror("Missing body properties")).end();
            }
            const existingUser = await this.repository.users.findFirst({where:{email: email}})
            if (existingUser) {
                return res.status(400).send(APIerror("User already exists")).end();
            }
            const salt = random();
            const role_obj = await this.repository.role.findFirst({where:{name: role }})
            const passwordHashed = authentication(salt, password)
            const user:Partial<User> = await this.repository.users.create({
                data:{
                    name: username,
                    email: email,
                    auth:{
                        create: {
                            password:passwordHashed,
                            salt: salt
                        }
                    }, 
                    role: {
                        connect: {
                            id: role_obj.id
                        }
                    }
                }
            }) 
            delete user.role_id
            try {
                user.token = JWTHelper.sign(user)
                
            }catch (error){
                return res.status(400).send(APIerror("Error creating jwt ")).end()
            }
            return res.status(200).send(user).end()
        
        } catch (error) {
            console.error(error);
            return res.sendStatus(400);
        }
    }

    public async login (req: express.Request | Partial<express.Request>, res: express.Response | Partial<express.Response>) {
        try{
            const {email, password} = req.body;
            if (!email || !password) {
                return res.sendStatus(400);
            }
            
            const user:Partial<User>  = await this.repository.users.findFirst({where:{email: email}, include:{
                auth:true, role:true
            }});

            if (!user) {
                return res.sendStatus(400);
            }
            const expectedHash = authentication(user.auth.salt, password)
            if (user.auth.password !== expectedHash) {
                return res.sendStatus(401)
            }
            delete user.auth
            delete user.role_id
            user.token = JWTHelper.sign(user)
            return res.status(200).send(user).end()
        }catch(error){
            console.error(error)
            return res.sendStatus(400);
        }
    }
}