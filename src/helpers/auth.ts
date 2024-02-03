import * as cryptografy from 'crypto'
import { User } from '../models/user';
import { Response } from 'models/API/response';

const SECRET = process.env.SECRET || "random-password"

export const random = () => cryptografy.randomBytes(128).toString('base64');
export const authentication = (salt: string, password: string ) => {
    return cryptografy.createHmac('sha256',[salt, password].join('/')).update(SECRET).digest().toString("base64")
} 

export const permissions_allowed = (permission: String, user_permissions: String[], res: Response | Partial<Response>)=>{
    if (!user_permissions.includes(permission)) {
        res.status(403).send({ message: "Forbidden: Not allowed to perform this action" });
        return false;
    }
    return true;
}