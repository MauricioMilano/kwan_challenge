import express from "express";
import { User } from "../user";

export interface Request extends express.Request {
    user?: Partial<User> | User;
    permissions?: String[]
  }