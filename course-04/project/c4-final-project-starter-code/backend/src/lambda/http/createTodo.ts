import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    try {
      const userId = getUserId(event)
      const data = await createTodo(newTodo, userId)
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      }
    } catch (error) {
      return {
        statusCode: error.statusCode || 500,
        body: JSON.stringify({
          message: error.message
        })
      }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
