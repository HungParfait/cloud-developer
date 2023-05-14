import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getAllTodos } from '../../helpers/todos'
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    try {
      const userId = getUserId(event)
      const data = await getAllTodos(userId)
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
