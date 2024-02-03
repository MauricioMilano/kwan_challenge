import {JWTHelper} from "../../../src/helpers/jwt"
import { User } from "../../../src/models/user"
import * as jwt from "jsonwebtoken";

const mockUser: Partial<User> = {id: "1", name:'user'};
const secret = process.env.JWT_SECRET || "secret";

describe('JWTHelper', () => {
  test('sign should return a valid jwt token', () => {
    const token = JWTHelper.sign(mockUser);
    expect(typeof token).toBe('string');
    const decoded = jwt.verify(token, secret);
    expect(decoded).toMatchObject(mockUser);
  });

  test('verify should return the decoded user', () => {
    const token = jwt.sign(mockUser, secret);
    const user = JWTHelper.verify(token);
    expect(user).toMatchObject(mockUser);
  });

  test('verify should throw an error if the token is invalid', () => {
    const token = 'invalid';
    expect(() => JWTHelper.verify(token)).toThrow('Invalid Token');
  });

});
