import { Auth } from "./auth";
import { Role } from "./role";
import { Tasks } from "./tasks";

export class User {
    id: string;
    name: string;
    email: string;
    role_id: string;
    tasks: Tasks[];
    auth: Auth | Partial<Auth> |  null;
    role: Role | Partial<Role> |  null;
  
    constructor(
      id: string,
      name: string,
      email: string,
      role_id: string,
      tasks: Tasks[],
      auth: Auth | null,
      role: Role | null
    ) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.role_id = role_id;
      this.tasks = tasks;
      this.auth = auth;
      this.role = role;
    }
    
  }
  