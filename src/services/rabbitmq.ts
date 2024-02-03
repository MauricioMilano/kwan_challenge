// Import the amqplib module
import * as amqp from "amqplib";

export class RabbitMQService {
  connectionURL: string;
  queueName: string;
  connection: amqp.Connection;
  channel: amqp.Channel;

  constructor(connectionURL: string, queueName: string) {
    this.connectionURL = connectionURL;
    this.queueName = queueName;

    this.createConnectionAndChannel();
  }

  public async send(message: string | object): Promise<void> {
    const buffer = Buffer.from(JSON.stringify(message));
    await this.channel.sendToQueue(this.queueName, buffer);
  }

  public async consume(callback: (message: any) => void): Promise<void> {
    await this.channel.consume(this.queueName, (msg) => {
      const message = JSON.parse(msg.content.toString());
      callback(message);
      this.channel.ack(msg);
    });
  }

  public async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }

  private async createConnectionAndChannel(): Promise<void> {
    this.connection = await amqp.connect(this.connectionURL);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.queueName, { durable: true });
  }
}
