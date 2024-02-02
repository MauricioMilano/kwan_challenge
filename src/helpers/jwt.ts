import * as jwt from "jsonwebtoken";
import { User } from "models/user";

const secret = process.env.JWT_SECRET
if (!secret) throw new Error("Jwt secret not found!") 
export class JWTHelper { 
    public static sign (data: Partial<User>) {
        const expiration = process.env.JWT_EXPIRES_IN || '7d'
        return jwt.sign(data, secret, {expiresIn: expiration })
    }
    public static verify (token: string): Partial<User> {
        try {
            const decoded = jwt.verify(token, secret)
            if (typeof decoded === "string") {
                throw new Error(`Decoded Error: ${decoded}` )
            }
            return decoded as Partial<User>
        }catch (error) {
            throw new Error("Invalid Token")
        }
    
}
}