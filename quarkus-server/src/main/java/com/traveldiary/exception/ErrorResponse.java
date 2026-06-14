package com.traveldiary.exception;

import java.time.Instant;

public class ErrorResponse {
    private int statusCode;
    private String message;
    private String error;
    private String timestamp;
    private String path;

    public ErrorResponse(int statusCode, String message, String error, String path) {
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.timestamp = Instant.now().toString();
        this.path = path;
    }

    public int getStatusCode() { return statusCode; }
    public String getMessage() { return message; }
    public String getError() { return error; }
    public String getTimestamp() { return timestamp; }
    public String getPath() { return path; }
}
