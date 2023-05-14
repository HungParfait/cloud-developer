import * as AWSXRay from 'aws-xray-sdk'
import { DynamoDBClient, QueryCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';


const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export interface rtnGetTodos {
    items: TodoItem[]
}

export interface rtnCreateTodo {
    item: TodoItem
}

export class TodosAccess {
    constructor(
        private readonly docClient = AWSXRay.captureAWSv3Client(new DynamoDBClient({})),
        private readonly todosTable = process.env.TODOS_TABLE
    ) { }

    async getAllTodos(userId: string): Promise<rtnGetTodos> {
        const command = new QueryCommand({
            TableName: this.todosTable,
            "ExpressionAttributeValues": {
                ":v1": {
                  "S": userId
                }
              },
              "KeyConditionExpression": "userId = :v1"
        });
        const result = await this.docClient.send(command);

        logger.info('Get all todos')
        const items = result.Items
        const rtnData = { items: [] }
        for(let item of items) {
            rtnData.items.push(unmarshall(item))
        }
        return rtnData as unknown as rtnGetTodos
    }

    async getTodo(todoId: string, userId: string): Promise<TodoItem> {
        const command = new GetItemCommand({
            TableName: this.todosTable,
            Key: {
                userId: {
                    S: userId
                },
                todoId: {
                    S: todoId
                },
            }
        });
        const result = await this.docClient.send(command);

        const item = unmarshall(result.Item)
        return item as unknown as TodoItem
    }

    async createTodo(todo: TodoItem): Promise<rtnCreateTodo> {
        todo.createdAt = new Date().toISOString()
        const command = new PutItemCommand({
            TableName: this.todosTable,
            Item: marshall(todo),
        });
        await this.docClient.send(command);
        
        logger.info('Create todo item')
        
        const rtn = {
            item: todo
        }
        return rtn as unknown as rtnCreateTodo
    }

    async updateTodo(todoId: string, userId: string, todo: TodoUpdate): Promise<void> {
        const command = new UpdateItemCommand({
            TableName: this.todosTable,
            AttributeUpdates: {
                name: {
                    Action: 'PUT',
                    Value: {
                        S: todo.name
                    }
                },
                dueDate: {
                    Action: 'PUT',
                    Value: {
                        S: todo.dueDate
                    }
                },
                done: {
                    Action: 'PUT',
                    Value: {
                        BOOL: todo.done
                    }
                }
            },
            Key: {
                "todoId": {
                    "S": todoId
                },
                "userId": {
                    "S": userId
                }
            }

        });
        await this.docClient.send(command);
    }

    async updateImageURL(todoId: string, userId: string, imgID: string): Promise<void> {
        const url = `https://${process.env.ATTACHMENT_S3_BUCKET}.s3.amazonaws.com/${imgID}.png`
        const command = new UpdateItemCommand({
            TableName: this.todosTable,
            AttributeUpdates: {
                name: {
                    Action: 'PUT',
                    Value: {
                        S: url
                    }
                },
            },
            Key: {
                "todoId": {
                    "S": todoId
                },
                "userId": {
                    "S": userId
                }
            }

        });
        await this.docClient.send(command);
    }

    async deleteTodo(todoId: string, userId: string): Promise<void> {
        const command = new DeleteItemCommand({
            TableName: this.todosTable,
            Key: {
                userId: {
                    S: userId
                },
                todoId: {
                    S: todoId
                },
            }

        });
        await this.docClient.send(command);

        return
    }
}
