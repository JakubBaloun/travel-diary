package com.traveldiary.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;

@Provider
@Priority(Priorities.HEADER_DECORATOR)
public class SecurityHeadersFilter implements ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext request, ContainerResponseContext response) {
        response.getHeaders().putSingle("X-Content-Type-Options", "nosniff");
        response.getHeaders().putSingle("X-Frame-Options", "DENY");
        response.getHeaders().putSingle("X-XSS-Protection", "0");
        response.getHeaders().putSingle("Referrer-Policy", "strict-origin-when-cross-origin");
        response.getHeaders().putSingle("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
}
