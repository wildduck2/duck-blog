```rs
HttpResponse::Ok()                    // 200 OK: Request succeeded, and the response contains the requested data or confirmation.
HttpResponse::Created()               // 201 Created: Resource successfully created (typically used after POST requests).
HttpResponse::BadRequest()            // 400 Bad Request: The server could not understand the request due to invalid syntax or missing parameters.
HttpResponse::Unauthorized()          // 401 Unauthorized: Authentication is required and has failed or not been provided (e.g., missing or invalid token/session).
HttpResponse::Forbidden()             // 403 Forbidden: The user is authenticated but does not have permission to access this resource.
HttpResponse::NotFound()              // 404 Not Found: The requested resource does not exist on the server.
HttpResponse::InternalServerError()   // 500 Internal Server Error: Something went wrong on the server while processing the request.
```

