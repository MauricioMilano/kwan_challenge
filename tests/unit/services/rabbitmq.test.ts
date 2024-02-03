import * as amqp from "amqplib";
import { RabbitMQService } from "../../../src/services/rabbitmq";

jest.mock("amqplib", () => ({
  connect: jest.fn().mockResolvedValue({
    createChannel: jest.fn().mockResolvedValue({
      assertQueue: jest.fn().mockResolvedValue({}),
      sendToQueue: jest.fn(),
      consume: jest.fn(),
      ack: jest.fn(),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

const connectionURL = "amqp://localhost";
const queueName = "test-queue";
const testMessage = { hello: "world" };

describe("RabbitMQService", () => {
  let service: RabbitMQService;

  beforeEach(() => {
    service = new RabbitMQService(connectionURL, queueName);
  });

  afterEach(async () => {
    await service.close();
  });

  test("should create a connection and a channel with the given URL and queue name", async () => {
    expect(amqp.connect).toHaveBeenCalledWith(connectionURL);
    expect(service.connection.createChannel).toHaveBeenCalled();
    expect(service.channel.assertQueue).toHaveBeenCalledWith(queueName, {
      durable: true,
    });
  });

  test("should send a message to the queue", async () => {
    await service.send(testMessage);
    expect(service.channel.sendToQueue).toHaveBeenCalledWith(
      queueName,
      Buffer.from(JSON.stringify(testMessage))
    );
  });

  test("should consume messages from the queue and invoke the callback", async () => {
    const callback = jest.fn();
    await service.consume(callback);
    expect(service.channel.consume).toHaveBeenCalledWith(
      queueName,
      expect.any(Function)
    );
    const consumeCallback = (service.channel.consume as jest.Mock).mock.calls[0][1];
    const msg = {
      content: Buffer.from(JSON.stringify(testMessage)),
    };
    consumeCallback(msg);
    expect(callback).toHaveBeenCalledWith(testMessage);
    expect(service.channel.ack).toHaveBeenCalledWith(msg);
  });

  test("should close the connection and the channel", async () => {
    await service.close();
    expect(service.channel.close).toHaveBeenCalled();
    expect(service.connection.close).toHaveBeenCalled();
  });
});
