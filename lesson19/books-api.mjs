/**
 * This file contains all HTTP API handling functions.
 */

import * as booksService from './books-service.mjs'
import errosMapping from './application-to-http-erros.mjs'
import { isGuid } from 'is-guid'
import errors from './errors.mjs'


// export async function getBooks(req, rsp) {
//     // rsp.type('application/json')
//         // .send(JSON.stringify(BOOKS))
//     let books = await booksService.getBooks()
//     rsp.json(books)
// }


export const getBooks = createHandler(internalGetBooks)
export const addBook = createHandler(internalAddBook)
export const getBook = createHandler(internalGetBook)
export const updateBook = createHandler(internalUpdateBook)
export const deleteBook = createHandler(internalDeleteBook)

function internalGetBooks(req, rsp) {
    return booksService.getBooks(req.token).then(
        books => rsp.json(books)
    )
}

function internalAddBook(req, rsp) {
    let bookRepresentation = req.body

    return booksService.createBook(bookRepresentation, req.token).then(
        book => rsp.status(201).json({
            description: `Book created`,
            uri: `/api/books/${book.id}`
        })
    )
}

function internalGetBook(req, rsp) {
    const bookId = req.params.bookId
    const userToken = req.token

    return booksService.getBook(bookId, userToken).then(
        book => rsp.json(book)
    )
}

function internalUpdateBook(req, rsp) {
    const bookRepresentation = req.body
    const bookId = req.params.bookId
    const userToken = req.token


    return booksService.updateBook(bookId, bookRepresentation, bookId, userToken)
        .then(book => rsp.json({ message: `Book with id ${bookId} updated` })
        )
}

function internalDeleteBook(req, rsp) {
    const bookId = req.params.bookId
    const userToken = extractToken(req)

    return booksService.deleteBook(bookId, userToken).then(
        bookId => rsp.json({ message: `Book with id ${bookId} deleted` })
    )
}

///////// Auxiliary functions


function createHandler(specificFunction) {
    return function (req, rsp, next) {
        const promiseResult = specificFunction(req, rsp)

        promiseResult
            .catch(error => sendError(rsp, error))
    }
}

function sendError(rsp, appError) {
    const httpError = errosMapping(appError)
    rsp.status(httpError.status).json(httpError.body)
}




export function extractToken(req, rsp, next) {
    console.log("extract token called")
    const authHeader = req.get("Authorization")
    if (authHeader) {
        const authHeaderParts = authHeader.split(" ")
        if (authHeaderParts.length == 2 && authHeaderParts[0] == "Basic" && isGuid(authHeaderParts[1])) {
            const token = authHeaderParts[1]
            if (token) {
                req.token = token
                return next()
            }
        }
    }

    sendError(rsp, errors.INVALID_DATA(`Token is required to use this API`))

}