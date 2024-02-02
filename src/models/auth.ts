import { User } from "./user"
export class Auth {
    id: string;
    user: User;
    user_id: string;
    password: string;
    salt: string;
  
    constructor(id: string, user: User, user_id: string, password: string, salt: string) {
      this.id = id;
      this.user = user;
      this.user_id = user_id;
      this.password = password;
      this.salt = salt;
    }
  }