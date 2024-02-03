import { User } from "./user";

export class Role {
    id: string;
    name: string;
    permissions: string;
    users: User[];
  
    constructor(id: string, name: string, permissions: string, users: User[]) {
      this.id = id;
      this.name = name;
      this.permissions = permissions;
      this.users = users;
    }

  }