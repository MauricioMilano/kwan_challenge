# Task API - Kwan challenge 
Welcome to the Task API. Here you see a demonstration of a task system API. Here you encounter routes  

## Getting Started 

### Warning

Before running the application, you must have to install docker.

### Cloning the repository

First you have to clone the repo: 

```sh 
git clone git@github.com:MauricioMilano/kwan_challenge.git && cd kwan_challenge 
```

Then run docker-compose startup command: 

```sh 
docker-compose up -d
``` 
Task Api API should run in http://localhost:3000

### Features 

These are some project-features implemented: 
- User 
    - Register 
    - Login 
- Tasks 
    - Create Task 
    - Get My Tasks
    - Get All Tasks
    - Get Task 
    - Perform Task 
    - Delete Task 



### Users and Roles 

Every user has a role attached. Those permissions allow user to call routes successfully.
Application has 2 mandatory roles: ```Technician``` and ```Manager```. They have different permissions. 

| Role       | permissions                                        |
| ---------- | -------------------------------------------------- |
| Technician | create_task, read_task, read_my_tasks, update_task |
| Manager    | read_all_tasks, delete_task                        |

Others roles can be added on database. (Improvement: Add feature to create role)

When you register or login, you must receive a payload indicating the user permission. 

Example of a manager Role. 
```json
{
    "id": "5e0a5e07-d60f-4465-9c43-ed05df9fdf6e",
    "name": "manager",
    "email": "manager@mail.com",
    "role": {
        "id": "b4b87ab0-b1ea-45da-ae55-477dd9b7ea33",
        "name": "Manager",
        "permissions": "read_all_tasks;delete_task"
    },
    "token": "eyJhb..."
}
```
## Routes 

| Route         | Method | Path             | Permission     |
| ------------- | ------ | ---------------- | -------------- |
| Register      | POST   | /auth/register   | -              |
| Login         | POST   | /auth/login      | -              |
| Create Tasks  | POST   | /tasks           | create_task    |
| Get My Tasks  | GET    | /tasks           | read_my_tasks  |
| Perform Task  | PATCH  | /tasks/{task_id} | update_task    |
| Delete Task   | DELETE | /tasks/{task_id} | delete_task    |
| Get All Tasks | GET    | /tasks/all       | read_all_tasks |

### Auth 
#### Register - [POST] auth/register
This endpoint allows a user to register with an email, password, username, and role. It returns a user object with a token if the registration is successful.
##### Request

| Property | Type   | Description                               |
| -------- | ------ | ----------------------------------------- |
| email    | string | The email of the user                     |
| password | string | The password of the user                  |
| username | string | The username of the user                  |
| role     | string | The role of the user (Technician/Manager) |

Example request body:

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "username": "user",
  "role": "Technician" || "Manager"
}

```

##### Response 
| Property | Type   | Description                 |
| -------- | ------ | --------------------------- |
| id       | string | The id of the user          |
| name     | string | The name of the user        |
| email    | string | The email of the user       |
| role     | object | The role object of the user |
| token    | string | The JWT token of the user   |

Example response body:

```json
{
  "id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576",
  "name": "user",
  "email": "user@example.com",
  "role": {
    "id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576",
    "name": "tecnician",
    "permissions": "create_task;read_task;read_my_tasks;update_task"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkFsaWNlIiwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjEyNzg1MjE2fQ.0y0w4s8x7ZlY1qy8aFw0k6x5jy3ZmQy2z4rQ9q1o9vM"
}

```

#### Login - [POST] auth/login
This endpoint allows a user to login with an email and password. It returns a user object with a token if the authentication is successful.

##### Request
The request body should have the following properties:

| Property | Type   | Description              |
| -------- | ------ | ------------------------ |
| email    | string | The email of the user    |
| password | string | The password of the user |

Example request body:

```json
{
  "email": "user@example.com",
  "password": "pass456"
}
``` 

##### Response
The response body will have the following properties:

| Property | Type   | Description                 |
| -------- | ------ | --------------------------- |
| id       | string | The id of the user          |
| name     | string | The name of the user        |
| email    | string | The email of the user       |
| role     | object | The role object of the user |
| token    | string | The JWT token of the user   |

Example response body:
```json
{
  "id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576",
  "name": "User",
  "email": "user@example.com",
  "role": {
    "id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576",
    "name": "Manager",
    "permissions":"read_all_tasks, delete_task"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6IkJvYiIsImVtYWlsIjoiYm9iQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjEyNzg1MjE2fQ.0y0w4s8x7ZlY1qy8aFw0k6x5jy3ZmQy2z4rQ9q1o9vM"
}
```

### Tasks

#### Create Tasks - [POST] /tasks
This endpoint allows a user to create a new task with a name and a summary. It requires the user to have the ```create_task``` permission. It returns the created task object if the operation is successful.
##### Request
The request body should have the following properties:

The request body should have the following properties:

| Property | Type   | Description             |
| -------- | ------ | ----------------------- |
| name     | string | The name of the task    |
| sumary   | string | The summary of the task |

Example request body:


```json

{
  "name": "Task name",
  "sumary": "Task Sumary"
}
```

##### Response 

The response body will have the following properties:

| Property | Type   | Description                   |
| -------- | ------ | ----------------------------- |
| id       | number | The id of the task            |
| name     | string | The name of the task          |
| sumary   | string | The summary of the task       |
| user_id  | object | The user id of the task owner |

```json 
{
  "id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576",
  "name": "Test Task",
  "sumary": "Write a task summary",
  "date_performed": null, 
  "user_id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576"
}

```


#### Get My Tasks - [GET] /tasks
This endpoint allows a user to get a list of their own tasks. It requires the user to have the ```read_my_tasks``` permission. It supports pagination with the ```page``` and ```limit``` query parameters. It returns an array of task objects if the operation is successful.
##### Request

The request could have the following optional query parameters:

| Parameter | Type   | Description                       |
| --------- | ------ | --------------------------------- |
| page      | number | The page number of the results    |
| limit     | number | The limit of the results per page |

Example request without query paramneters: 

```
GET /tasks
```

Example request with query paramneters: 

```
GET /tasks?page=1&limit=10
```

##### Response
The response body will have an array of objects containing the following properties:

| Property       | Type   | Description                          |
| -------------- | ------ | ------------------------------------ |
| id             | number | The id of the task                   |
| name           | string | The name of the task                 |
| sumary         | string | The summary of the task              |
| date_performed | date   | The date when the task was performed |
| user_id        | string | The user id of the task owner        |

```json
[
    {
        "id": "3714df69-973f-41b8-a2ff-5596833968cf",
        "name": "task 1",
        "sumary": "tarefa 1 - example teste",
        "date_performed": "2024-02-03T16:14:17.955Z",
        "user_id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576"
    },
    {
        "id": "7dd18077-92e0-48c0-881a-18ba03e1ae50",
        "name": "task 2",
        "sumary": "tarefa 2 - clean house",
        "date_performed": null,
        "user_id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576"
    },
]

```


#### Perform Task - [PATCH] /tasks/{task_id}

This endpoint allows a user to perform a task with a given id. It requires the user to have the ```update_task``` permission. It updates the ```date_performed``` field of the task to the current date and sends a message to the queue. It returns the updated task object if the operation is successful. The user only can perform this action once per task, and only in tasks that user was onwer.  

##### request 

The request should have the following mandatorty path parameter:

| Parameter | Type   | Description                   |
| --------- | ------ | ----------------------------- |
| task_id   | number | The id of the task to perform |



Example request:

```
PATCH /tasks/3714df69-973f-41b8-a2ff-5596833968cf
```

##### Response
The response body will have the following properties:

| Property       | Type   | Description                          |
| -------------- | ------ | ------------------------------------ |
| id             | number | The id of the task                   |
| name           | string | The name of the task                 |
| sumary         | string | The summary of the task              |
| date_performed | date   | The date when the task was performed |
| user_id        | string | The user id of the task owner        |

```json
    {
        "id": "3714df69-973f-41b8-a2ff-5596833968cf",
        "name": "task 1",
        "sumary": "tarefa 1 - example teste",
        "date_performed": "2024-02-03T16:14:17.955Z",
        "user_id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576"
    }
```

#### Delete Tasks - [DELETE] /tasks/{task_id}
This endpoint allows a user to delete a task with a given id. It requires the user to have the ```delete_task``` permission. It returns the deleted task object if the operation is successful.

##### Request
The request should have the following mandatory path parameter:

| Parameter | Type   | Description                  |
| --------- | ------ | ---------------------------- |
| task_id   | number | The id of the task to delete |

Example request:

```
DELETE /tasks/3714df69-973f-41b8-a2ff-5596833968cf
```

The response body will have the following properties:

| Property       | Type   | Description                          |
| -------------- | ------ | ------------------------------------ |
| id             | number | The id of the task                   |
| name           | string | The name of the task                 |
| sumary         | string | The summary of the task              |
| date_performed | date   | The date when the task was performed |
| user_id        | string | The user id of the task owner        |

Example response body:

```json
    {
        "id": "3714df69-973f-41b8-a2ff-5596833968cf",
        "name": "task 1",
        "sumary": "tarefa 1 - example teste",
        "date_performed": "2024-02-03T16:14:17.955Z",
        "user_id": "e68d25c3-889a-4b0a-b6d3-d62fa08b0576"
    }
```

#### Get all tasks[GET] /tasks/all
This endpoint allows a user to get a list of all tasks. It requires the user to have the ```read_all_tasks``` permission. It supports pagination with the page and limit query parameters. It returns an array of task objects if the operation is successful.

##### Request
The request should have the following query parameters:

Parameter	Type	Description
page	number	The page number of the results
limit	number	The limit of the results per page
Example request:

```
GET /tasks/all?page=1&limit=10
```

##### Response
The response body will have an array of objects containing the following properties:

| Property | Type   | Description                       |
| -------- | ------ | --------------------------------- |
| id       | number | The id of the task                |
| name     | string | The name of the task              |
| sumary   | string | The summary of the task           |
| owner    | object | The user object of the task owner |
| user_id  | object | The user id of the task owner     |


Example response body:

``` json
[
    {
        "id": "f6d4197a-7d38-4220-baea-5ab2fcfbbedd",
        "name": "task 5",
        "sumary": "tarefa 2 - milano teste",
        "date_performed": "2024-02-03T14:41:04.272Z",
        "user_id": "7bb71627-8483-42e8-bf05-20fdefa5e058",
        "owner": {
            "id": "7bb71627-8483-42e8-bf05-20fdefa5e058",
            "name": "technician",
            "email": "technician@mail.com",
            "role_id": "4c321216-ca22-4c68-b03f-823ef8845afa"
        }
    }
]
``` 