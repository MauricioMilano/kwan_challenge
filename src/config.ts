import { User } from "./models/user"
import { Role } from "./models/role"

export const TASK_PERMISSIONS: { [key: string]: string } = {
    read: "read_task",
    readMy: "read_my_tasks",
    create: "create_task",
    update: "update_task",
    delete: "delete_task",
    readAll: "read_all_tasks"
}

export const ROLES: { [key: string]: Partial<Role> } = {
    Technician: { name: "Technician", permissions: [TASK_PERMISSIONS.create, TASK_PERMISSIONS.read, TASK_PERMISSIONS.readMy, TASK_PERMISSIONS.update].join(";") },
    Manager: { name: "Manager", permissions: [TASK_PERMISSIONS.readAll, TASK_PERMISSIONS.delete].join(";") }
}

export const USERS_DEFAULT: { [key: string]: Partial<User> } = {
    Manager: {
        name: "manager",
        email: "manager@mail.com",
        role: {
            name: ROLES.Manager.name
        },
        auth: {
            password: "mana123"
        }

    },
    Tecnician: {
        name: "technician",
        email: "technician@mail.com",
        auth: { password: "tech123" },
        role: {
            name: ROLES.Technician.name
        }
    }
}
