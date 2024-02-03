
import { PrismaClient } from "@prisma/client/extension";
import express, { Response } from "express";
import { Request } from "../../../src/models/API/request";
import { Role } from "../../../src/models/role";
import e from "express";
import tasks from "../../../src/router/tasks";
import { permissions_allowed } from "../../../src/helpers/auth"
import { APIerror } from "../../../src/models/API/error";
import { TASK_PERMISSIONS } from "../../../src/config";
import { TasksController } from "../../../src/controllers/tasks";
import { User } from "../../../src/models/user";
import { RabbitMQService } from "../../../src/services/rabbitmq"

jest.mock("@prisma/client/extension", () => {
  const mockPrismaClient = {
    tasks: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),

    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});
jest.mock("../../../src/services/rabbitmq", () => {
  const mockRabbitMQ = {
    send: jest.fn()
  }
  return {
    RabbitMQService: jest.fn(() => mockRabbitMQ)
  }
}
)


jest.mock("../../../src/helpers/auth", () => ({
  permissions_allowed: jest.fn(),
}));

const mockRole: Role = {
  id: "",
  name: "admin",
  permissions: "read;write;delete",
  users: ([] as User[])
}

const mockUser: Partial<User> = {
  name: "user",
  email: "user@example.com",
  role: mockRole,
  token: "mockToken",
};


const mockTask = {
  id: "1",
  name: "Test task",
  sumary: "This is a test task",
  owner: mockUser,
};


const mockRequest: Partial<Request> = {
  user: mockUser
}


const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  end: jest.fn().mockReturnThis(),
};

const client = new PrismaClient()
const QueueCon = new RabbitMQService("amqp://", "default")
const tasksController = new TasksController(client, QueueCon);


describe("TasksController class", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe("create method", () => {

    test("should create a new task and return a 200 response with the task", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.body = {
        name: mockTask.name,
        sumary: mockTask.sumary,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.create as jest.Mock).mockResolvedValue(mockTask);


      await tasksController.create(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.create,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.create).toHaveBeenCalledWith({
        data: {
          name: mockTask.name,
          sumary: mockTask.sumary,
          owner: {
            connect: {
              id: mockUser.id,
            },
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
      expect(mockResponse.end).toHaveBeenCalled();
    });


    test("should return early if the user does not have the permission to create a task", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.body = {
        name: mockTask.name,
        sumary: mockTask.sumary,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(false);


      await tasksController.create(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.create,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.create).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });


    test("should return a 422 response with an error message if the request body is missing some properties", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.body = {
        name: mockTask.name,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);


      await tasksController.create(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.create,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Missing body properties")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });


    test("should return a 500 response with an error message if there is any other error", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.body = {
        name: mockTask.name,
        sumary: mockTask.sumary,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      const mockError = new Error("Generic error");
      (client.tasks.create as jest.Mock).mockRejectedValue(mockError);


      await tasksController.create(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.create,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.create).toHaveBeenCalledWith({
        data: {
          name: mockTask.name,
          sumary: mockTask.sumary,
          owner: {
            connect: {
              id: mockUser.id,
            },
          },
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Internal server error")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });


  describe("get method", () => {

    test("should find the tasks of the user and return a 200 response with the tasks", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.query = {
        page: "1",
        limit: "10",
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findMany as jest.Mock).mockResolvedValue([mockTask]);


      await tasksController.get(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.readMy,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findMany).toHaveBeenCalledWith({
        where: {
          user_id: mockUser.id,
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([mockTask]);
      expect(mockResponse.end).toHaveBeenCalled();
    });


    test("should return early if the user does not have the permission to read their own tasks", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.query = {
        page: "1",
        limit: "10",
      };
      (permissions_allowed as jest.Mock).mockReturnValue(false);


      await tasksController.get(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.readMy,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findMany).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });


    test("should return a 500 response with an error message if there is any other error", async () => {

      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.query = {
        page: "1",
        limit: "10",
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      const mockError = new Error("Generic error");
      (client.tasks.findMany as jest.Mock).mockRejectedValue(mockError);


      await tasksController.get(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.readMy,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findMany).toHaveBeenCalledWith({
        where: {
          user_id: mockUser.id,
        },
        orderBy: {
          id: "asc",
        },
        skip: 0,
        take: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Internal server error")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });


  describe("getAll method", () => {

    test("should find all the tasks and return a 200 response with the tasks", async () => {

      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.query = {
        page: "1",
        limit: "10",
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findMany as jest.Mock).mockResolvedValue([mockTask]);


      await tasksController.getAll(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.readAll,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          id: "asc",
        },
        include: {
          owner: true,
        },
        skip: 0,
        take: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([mockTask]);
      expect(mockResponse.end).toHaveBeenCalled();
    });


    test("should return early if the user does not have the permission to read all the tasks", async () => {

      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.query = {
        page: "1",
        limit: "10",
      };
      (permissions_allowed as jest.Mock).mockReturnValue(false);


      await tasksController.getAll(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.readAll,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findMany).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });


    test("should return a 500 response with an error message if there is any other error", async () => {

      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.query = {
        page: "1",
        limit: "10",
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      const mockError = new Error("Generic error");
      (client.tasks.findMany as jest.Mock).mockRejectedValue(mockError);


      await tasksController.getAll(mockRequest, mockResponse);


      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.readAll,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: {
          id: "asc",
        },
        include: {
          owner: true,
        },
        skip: 0,
        take: 10,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Internal server error")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe("perform method", () => {
    test("should update the task with the current date and return a 200 response with the task", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findFirst as jest.Mock).mockResolvedValue(mockTask);
      (client.tasks.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        date_performed: new Date(),
      });

      await tasksController.perform(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.update,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id, user_id: mockUser.id },
        include: {
          owner: true,
        },
      });
      expect(client.tasks.update).toHaveBeenCalledWith({
        where: {
          id: mockTask.id,
        },
        data: {
          date_performed: expect.any(Date),
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        ...mockTask,
        date_performed: expect.any(Date),
      });
      expect(mockResponse.end).toHaveBeenCalled();
    });

    test("should return early if the user does not have the permission to update a task", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(false);

      await tasksController.perform(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.update,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).not.toHaveBeenCalled();
      expect(client.tasks.update).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });

    test("should return a 404 response with an error message if the task does not exist", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findFirst as jest.Mock).mockResolvedValue(null);

      await tasksController.perform(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.update,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id, user_id: mockUser.id },
        include: {
          owner: true,
        },
      });
      expect(client.tasks.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Task not found")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    test("should return a 400 response with an error message if the task is already performed", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findFirst as jest.Mock).mockResolvedValue({
        ...mockTask,
        date_performed: new Date(),
      });

      await tasksController.perform(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.update,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id, user_id: mockUser.id },
        include: {
          owner: true,
        },
      });
      expect(client.tasks.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Task already performed")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    test("should return a 500 response with an error message if there is any other error", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      const mockError = new Error("Generic error");
      (client.tasks.findFirst as jest.Mock).mockRejectedValue(mockError);

      await tasksController.perform(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.update,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id, user_id: mockUser.id },
        include: {
          owner: true,
        },
      });
      expect(client.tasks.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Internal server error")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe("delete method", () => {
    test("should delete the task and return a 200 response with the task", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findFirst as jest.Mock).mockResolvedValue(mockTask);
      (client.tasks.delete as jest.Mock).mockResolvedValue(mockTask);

      await tasksController.delete(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.delete,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id },
      });
      expect(client.tasks.delete).toHaveBeenCalledWith({
        where: {
          id: mockTask.id,
        },
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
      expect(mockResponse.end).toHaveBeenCalled();
    });

    test("should return early if the user does not have the permission to delete a task", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(false);
      await tasksController.delete(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.delete,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).not.toHaveBeenCalled();
      expect(client.tasks.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockResponse.end).not.toHaveBeenCalled();
    });

    test("should return a 404 response with an error message if the task does not exist", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      (client.tasks.findFirst as jest.Mock).mockResolvedValue(null);

      await tasksController.delete(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.delete,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id },
      });
      expect(client.tasks.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Task not found")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });

    test("should return a 500 response with an error message if there is any other error", async () => {
      mockRequest.user = mockUser;
      mockRequest.permissions = mockRole.permissions.split(";");
      mockRequest.params = {
        task_id: mockTask.id,
      };
      (permissions_allowed as jest.Mock).mockReturnValue(true);
      const mockError = new Error("Generic error");
      (client.tasks.findFirst as jest.Mock).mockRejectedValue(mockError);

      await tasksController.delete(mockRequest, mockResponse);

      expect(permissions_allowed).toHaveBeenCalledWith(
        TASK_PERMISSIONS.delete,
        mockRequest.permissions,
        mockResponse
      );
      expect(client.tasks.findFirst).toHaveBeenCalledWith({
        where: { id: mockTask.id },
      });
      expect(client.tasks.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        APIerror("Internal server error")
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });
});
