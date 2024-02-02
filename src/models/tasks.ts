import { User } from "./user";

export class Tasks {
    id: string;
    name: string;
    summary: string;
    date_performed: Date;
    owner: User | null;
    user_id: string;
  
    constructor(
      id: string,
      name: string,
      summary: string,
      date_performed: Date,
      owner: User | null,
      user_id: string
    ) {
      this.id = id;
      this.name = name;
      this.summary = summary;
      this.date_performed = date_performed;
      this.owner = owner; 
      this.user_id = user_id;
    }
  }