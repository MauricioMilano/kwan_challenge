import crypto from 'crypto'
import { User } from '../models/user';
import { Response } from 'models/API/response';

const SECRET = process.env.SECRET || "random-password"

export const random = () => crypto.randomBytes(128).toString('base64');
export const authentication = (salt: string, password: string ) => {
    return crypto.createHmac('sha256',[salt, password].join('/')).update(SECRET).digest()
} 

export const permissions_allowed = (permission: String, user_permissions: String[], res: Response)=>{
    if (!user_permissions.includes(permission)) {
        res.status(403).send({ message: "Forbidden: Not allowed to perform this action" });
        return false;
    }
    return true;
}