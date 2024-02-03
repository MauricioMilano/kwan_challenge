import * as auth from '../../../src/helpers/auth';
import { User } from "../../../src/models/user"

const salt = 'abc123';
const password = 'secret';
const hashedPassword = auth.authentication(salt, password);
const user: Partial<User> = { name: 'user', auth:{ password: hashedPassword }, role: {permissions: ['read', 'write'].join(";")}};

const mockResponse = () => {
    const res:any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

describe('random function', () => {
  test('should return a base64 string of length 172', () => {
    const result = auth.random();
    expect(result).toHaveLength(172);
    expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('authentication function', () => {
  test('should return a base64 string of length 44', () => {
    const result = auth.authentication(salt, password);
    expect(result).toHaveLength(44);
    expect(result).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test('should return the same value for the same salt and password', () => {
    const result1 = auth.authentication(salt, password);
    const result2 = auth.authentication(salt, password);
    expect(result1).toEqual(result2);
  });

  test('should return different values for different salts or passwords', () => {
    const result1 = auth.authentication(salt, password);
    const result2 = auth.authentication('xyz789', password);
    const result3 = auth.authentication(salt, 'secret2');
    expect(result1).not.toEqual(result2);
    expect(result1).not.toEqual(result3);
    expect(result2).not.toEqual(result3);
  });
});

describe('permissions_allowed function', () => {
  test('should return true if the user has the required permission', () => {
    let permissions = user.role?.permissions?.split(";") || []
    const res = mockResponse();
    const result = auth.permissions_allowed('read', permissions, res);
    expect(result).toBe(true);
  });

  test('should return false and send a 403 response if the user does not have the required permission', () => {
    let permissions = user.role?.permissions?.split(";") || []
    const res = mockResponse();
    const result = auth.permissions_allowed('delete', permissions, res);
    expect(result).toBe(false);
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.send).toHaveBeenCalledWith({ message: "Forbidden: Not allowed to perform this action" })
  });
});
