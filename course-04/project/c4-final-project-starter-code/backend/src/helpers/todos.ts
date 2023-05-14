import { TodosAccess, rtnCreateTodo, rtnGetTodos } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import * as createError from 'http-errors';

// TODO: Implement businessLogic
const todoAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

type UrlType = {
    uploadUrl: string
}

export async function getAllTodos(userId: string): Promise<rtnGetTodos> {
    return todoAccess.getAllTodos(userId)
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<rtnCreateTodo> {
    const todoId = uuid.v4()

    //const url = await attachmentUtils.getPreSignedURL(todoId)

    return await todoAccess.createTodo({
        userId,
        name: createTodoRequest.name,
        todoId,
        createdAt: new Date().toISOString(),
        dueDate: createTodoRequest.dueDate,
        done: false
    })
}

export async function deleteTodo(todoId: string, userId: string): Promise<Error | void> {
    const todoResult = await todoAccess.getTodo(todoId, userId);
    if (todoResult['userId'] !== userId) {
        return createError(401, 'Forbidden!')
    }

    return await todoAccess.deleteTodo(todoId, userId)
}

export async function updateTodo(todoId: string, updateTodoRequest: UpdateTodoRequest, userId: string): Promise<Error | void> {
    const todoResult = await todoAccess.getTodo(todoId, userId);
    if (todoResult['userId'] !== userId) {
        return createError(401, 'Forbidden!')
    }

    return await todoAccess.updateTodo(todoId, userId, updateTodoRequest)
}

export async function createAttachmentPresignedUrl(todoId: string, userId: string): Promise<UrlType> {
    // const todoResult = await todoAccess.getTodo(todoId, userId);
    // return { url: todoResult.attachmentUrl }
    const imgID = uuid.v4();
    await todoAccess.updateImageURL(todoId, userId, imgID);
    const url = await attachmentUtils.getPreSignedURL(imgID);

    return {
        uploadUrl: url
    }
}
