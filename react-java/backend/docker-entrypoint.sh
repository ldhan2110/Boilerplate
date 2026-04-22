#!/bin/bash
set -e

# Fix ownership of mounted volumes if they exist
# This is needed because host-mounted volumes override container directory ownership
if [ -d "/app/files" ]; then
    chown -R spring:spring /app/files || true
fi

if [ -d "/app/uploads" ]; then
    chown -R spring:spring /app/uploads || true
fi

if [ -d "/app/logs" ]; then
    chown -R spring:spring /app/logs || true
fi

if [ -d "/app/tmp" ]; then
    chown -R spring:spring /app/tmp || true
fi

if [ -d "/app/data" ]; then
    chown -R spring:spring /app/data || true
fi

# Switch to spring user and execute the application
exec gosu spring java -jar app.jar "$@"
