package com.traveldiary.exception;

import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import org.jboss.logging.Logger;

import jakarta.ws.rs.WebApplicationException;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Throwable> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class);

    @Context
    UriInfo uriInfo;

    @Override
    public Response toResponse(Throwable exception) {
        int status;
        String message;
        String error;

        if (exception instanceof UnauthorizedException) {
            status = 401;
            message = exception.getMessage();
            error = "UnauthorizedException";
        } else if (exception instanceof NotFoundException) {
            status = 404;
            message = exception.getMessage();
            error = "NotFoundException";
        } else if (exception instanceof BadRequestException) {
            status = 400;
            message = exception.getMessage();
            error = "BadRequestException";
        } else if (exception instanceof WebApplicationException) {
            var webEx = (WebApplicationException) exception;
            status = webEx.getResponse().getStatus();
            var entity = webEx.getResponse().getEntity();
            message = entity != null ? entity.toString() : exception.getMessage();
            error = exception.getClass().getSimpleName();
        } else if (exception instanceof jakarta.validation.ValidationException) {
            status = 400;
            message = exception.getMessage();
            error = "ValidationException";
        } else {
            status = 500;
            message = "Internal server error";
            error = "InternalServerError";
            LOG.error("Unhandled exception", exception);
        }

        var body = new ErrorResponse(status, message, error, uriInfo.getPath());

        return Response.status(status)
                .entity(body)
                .build();
    }
}
