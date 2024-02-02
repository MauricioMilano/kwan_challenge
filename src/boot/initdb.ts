import { PrismaClient } from '@prisma/client';
import { ROLES, USERS_DEFAULT } from '../config';

import { authentication, random } from "../helpers/auth";

export default async (repository: PrismaClient): Promise<void> => {
    let roles: { [key: string]: string; } = await upsertRoles(repository);
    await upsertUsers(repository, roles);
    return;
}

async function upsertUsers(repository:PrismaClient, roles: { [key: string]: string; }) {
    for (const elem of Object.keys(USERS_DEFAULT)) {
        let user = await repository.users.findFirst({ where: { email: USERS_DEFAULT[elem].email } });
        if (!user) {
            const salt = random()
            user = await repository.users.create({
                data: {
                    name: USERS_DEFAULT[elem].name,
                    email: USERS_DEFAULT[elem].email,
                    role: {
                        connect: {
                            id: roles[USERS_DEFAULT[elem].role.name]
                        }
                    },
                    auth: {
                        create: {
                            password: authentication(salt,USERS_DEFAULT[elem].auth.password),
                            salt: salt,
                        }
                    }
                }
            });
        }
    }
}

async function upsertRoles(repository:PrismaClient) {
    let roles: { [key: string]: string; } = {};
    for (const elem of Object.keys(ROLES)) {
        let role = await repository.role.findFirst({ where: { name: ROLES[elem].name } });
        if (!role) {
            role = await repository.role.create({
                data: {
                    name: ROLES[elem].name,
                    permissions: ROLES[elem].permissions,
                }
            });
        }
        roles[ROLES[elem].name] = role.id;
    }
    return roles;
}
