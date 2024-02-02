import express from "express";
import { JWTHelper } from "../helpers/jwt";
import { User } from "models/user";
import { Request } from "../models/API/request";



export const Authenticate = (req: Request, res:express.Response, next: express.NextFunction):void => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
  
      try {
        const user = JWTHelper.verify(token);
        req.user = user;
        req.permissions = user.role.permissions.split(";")

  
        next();
      } catch (error) {
        res.status(401).json({ message: error.message });
      }
    } else {
      res.status(401).json({ message: "Authorization header is required and must be in the format 'Bearer <token>'" });
    }
} 