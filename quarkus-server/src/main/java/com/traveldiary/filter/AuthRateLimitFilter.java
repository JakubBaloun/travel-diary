package com.traveldiary.filter;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

import java.net.InetAddress;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Provider
@Priority(Priorities.AUTHENTICATION - 10)
public class AuthRateLimitFilter implements ContainerRequestFilter {

    private static final Map<String, SlidingWindow> WINDOWS = new ConcurrentHashMap<>();
    private static final int LIMIT = 5;
    private static final long WINDOW_MS = 60_000;

    @Override
    public void filter(ContainerRequestContext ctx) {
        var path = ctx.getUriInfo().getPath();
        if (!path.startsWith("/api/auth/")) {
            return;
        }

        var ip = ctx.getHeaderString("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = ctx.getHeaderString("X-Real-IP");
        }
        if (ip == null || ip.isBlank()) {
            try {
                ip = InetAddress.getLocalHost().getHostAddress();
            } catch (Exception e) {
                ip = "unknown";
            }
        }

        var key = ip + ":" + path;
        var window = WINDOWS.computeIfAbsent(key, k -> new SlidingWindow(LIMIT, WINDOW_MS));

        if (!window.tryAcquire()) {
            ctx.abortWith(
                    jakarta.ws.rs.core.Response.status(429)
                            .entity(Map.of(
                                    "statusCode", 429,
                                    "message", "Too many requests",
                                    "error", "ThrottlerException",
                                    "timestamp", java.time.Instant.now().toString(),
                                    "path", path
                            ))
                            .build()
            );
        }
    }

    private static class SlidingWindow {
        private final long[] timestamps;
        private final int limit;
        private final long windowMs;
        private final AtomicInteger index = new AtomicInteger(0);

        SlidingWindow(int limit, long windowMs) {
            this.limit = limit;
            this.windowMs = windowMs;
            this.timestamps = new long[limit];
        }

        synchronized boolean tryAcquire() {
            var now = System.currentTimeMillis();
            var idx = index.get() % limit;
            var oldest = timestamps[idx];

            if (now - oldest > windowMs) {
                timestamps[idx] = now;
                index.incrementAndGet();
                return true;
            }

            return false;
        }
    }
}
