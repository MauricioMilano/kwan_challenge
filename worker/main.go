package main

import (
	"fmt"
	"log"
	"os"

	"github.com/streadway/amqp"
)

func getEnv(key, fallback string) string {
	value, ok := os.LookupEnv(key)
	if !ok {
		value = fallback
	}
	return value
}
func main() {
	user := getEnv("RABBITMQ_USER", "admin")
	pass := getEnv("RABBITMQ_PASS", "admin")
	host := getEnv("RABBITMQ_HOST", "rabbitmq")
	port := getEnv("RABBITMQ_PORT", "5672")
	queue := getEnv("RABBITMQ_QUEUE", "default")
	connection_str := fmt.Sprintf("amqp://%s:%s@%s:%s/", user, pass, host, port)
	log.Println(connection_str)
	conn, err := amqp.Dial(connection_str)
	if err != nil {
		log.Println(err)
		log.Fatal(err)

	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal(err)
	}
	defer ch.Close()

	q, err := ch.QueueDeclare(
		queue, // name of the queue
		true,  // durable
		false, // delete when unused
		false, // exclusive
		false, // no-wait
		nil,   // arguments
	)
	if err != nil {
		log.Fatal(err)
	}

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	if err != nil {
		log.Fatal(err)
	}

	done := make(chan bool)

	go func() {
		for d := range msgs {
			fmt.Println("Received a message:", string(d.Body))
		}
	}()

	// Wait for a signal to exit
	log.Println("Waiting for messages. To exit press CTRL+C")
	<-done
}
