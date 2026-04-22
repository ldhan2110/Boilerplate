#!/bin/bash
ENV=$1
DESTINATION_BE=".env"
UPPERCASE_ENV=${ENV^^}

# CI/CD environment variables
NODE_ENV="${UPPERCASE_ENV}_NODE_ENV"
PORT="${UPPERCASE_ENV}_PORT"
API_URL="${UPPERCASE_ENV}_API_URL"
SOCKET_URL="${UPPERCASE_ENV}_SOCKET_URL"

printf "\033[1;32m Generating environment file... \033[0m\n"
printf "############################################\n" >> $DESTINATION_BE
printf "# (This file was generated automatically.) #\n" >> $DESTINATION_BE
printf "############################################\n" >> $DESTINATION_BE

# CI/CD environment variables
echo "# Generated .env file for CI/CD" > "$DESTINATION_BE"
echo "NODE_ENV=${!NODE_ENV}" >> "$DESTINATION_BE"
echo "VITE_PORT=${!PORT}" >> "$DESTINATION_BE"
echo "VITE_API_URL=${!API_URL}" >> "$DESTINATION_BE"
echo "VITE_SOCKET_URL=${!SOCKET_URL}" >> "$DESTINATION_BE"

printf "\033[1;32m Environment file ($DESTINATION_BE) was successfully generated. \033[0m\n"
