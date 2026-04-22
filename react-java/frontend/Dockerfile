# Base
FROM node:22 AS base
EXPOSE 3000

# Install dependencies Stage
FROM base AS dev
WORKDIR /lbu-erp-frontend
COPY package*.json yarn.lock ./
RUN yarn --frozen-lockfile

# Builder Stage
FROM base AS devbuilder
WORKDIR /lbu-erp-frontend
COPY --from=dev /lbu-erp-frontend/node_modules ./node_modules
COPY . .
# Accept build arguments for environment variables
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=/ws
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
RUN yarn build && yarn --frozen-lockfile --production && yarn cache clean


# Serve Nginx Stage
FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=devbuilder /lbu-erp-frontend/dist /usr/share/nginx/html
COPY --from=devbuilder /lbu-erp-frontend/nginx/nginx.conf /etc/nginx/conf.d/
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]