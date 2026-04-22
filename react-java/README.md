# Enterprise Full-Stack Boilerplate

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.0-6DB33F?style=flat-square&logo=spring-boot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-optional-DC382D?style=flat-square&logo=redis&logoColor=white)
![Java](https://img.shields.io/badge/Java-17-ED8B00?style=flat-square&logo=openjdk&logoColor=white)

A production-grade, full-stack enterprise boilerplate (internally `posco-gfa` / `hrm-x`) for HRM/ERP-class systems. Ships with multi-tenancy, role-based access control, internationalization, AI assistant integration, document generation, real-time messaging, and observability — ready to clone and extend into a new project.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Getting Started — Backend](#getting-started--backend)
- [Getting Started — Frontend](#getting-started--frontend)
- [Environment Configuration](#environment-configuration)
- [Docker Build](#docker-build)
- [OpenAPI Code Generation](#openapi-code-generation)
- [Feature Toggles](#feature-toggles)
- [API Documentation](#api-documentation)
- [Monitoring](#monitoring)
- [Customization Guide](#customization-guide)

---

## Overview

This boilerplate is the canonical starting point for any new enterprise web application at the organization. It encodes architectural decisions, security patterns, and integration patterns that would otherwise be rebuilt from scratch on every project.

**Target audience:** Backend Java engineers, frontend React/TypeScript engineers, and DevOps engineers standing up a new internal enterprise system.

**What you get out of the box:**

- A secured Spring Boot REST API with JWT authentication and optional Keycloak OAuth2
- A React 18 SPA with Ant Design 5, fully typed via auto-generated OpenAPI client code
- Multi-tenant database routing so a single deployment serves multiple isolated tenants
- RBAC enforced at both the API and UI layer (Spring Security + CASL)
- Document generation in PDF (JasperReports, Apache FOP), Excel (Apache POI, ExcelJS), and DOCX (docx4j)
- AI/LLM assistant via LangChain4j supporting Google Gemini, Ollama (local), and OpenAI
- Real-time push via WebSocket STOMP
- Prometheus metrics endpoint for Grafana integration
- Full i18n infrastructure (i18next) supporting multiple locales

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  React 18 + TypeScript + Vite                                │
│  Ant Design 5  |  MobX / Zustand  |  TanStack Query         │
│  CASL (RBAC)   |  i18next (i18n)  |  STOMP WebSocket client │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST  (Axios + auto-generated client)
                        │ WebSocket  (STOMP over SockJS)
┌───────────────────────▼─────────────────────────────────────┐
│  Spring Boot 3.5.0  (port 8080)                             │
│                                                              │
│  Security layer   : Spring Security + JWT / Keycloak OAuth2  │
│  API layer        : REST controllers, OpenAPI (SpringDoc)    │
│  Domain core      : com.clt.hrm.core  (auth, admin, jobs)   │
│  Infrastructure   : com.clt.hrm.infra (files, email, export) │
│  Multi-tenancy    : com.clt.hrm.tenant (datasource routing)  │
│  AI assistant     : LangChain4j → Gemini / Ollama / OpenAI   │
│  Scheduler        : Quartz                                   │
│  Observability    : Micrometer + Prometheus actuator         │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼──────┐  ┌───────▼────────────────┐
│ PostgreSQL  │  │  Redis        │  │  Kafka (optional)       │
│ Primary DB  │  │  Cache/Session│  │  Async messaging        │
│ + per-tenant│  │  (toggleable) │  │  (toggleable)           │
│   databases │  └───────────────┘  └────────────────────────┘
└─────────────┘
```

---

## Tech Stack

### Backend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Java | 17 |
| Framework | Spring Boot | 3.5.0 |
| Build tool | Gradle | 8.13 (wrapper) |
| Security | Spring Security + jjwt | 0.11.5 |
| OAuth2 (optional) | Keycloak resource server | via Spring OAuth2 |
| ORM | Spring Data JPA + Hibernate | via Spring Boot BOM |
| SQL mapper | MyBatis | 3.0.4 |
| Database | PostgreSQL | — |
| Connection pool | HikariCP | via Spring Boot BOM |
| Cache | Redis via Lettuce | via Spring Boot BOM |
| Messaging | WebSocket STOMP | via Spring Boot BOM |
| Messaging (async) | Kafka | via Spring Boot BOM |
| PDF reports | JasperReports | 7.0.3 |
| Excel | Apache POI | 5.4.1 |
| DOCX generation | docx4j | 11.4.9 |
| DOCX/XLSX to PDF | Apache FOP | 2.9 |
| AI / LLM | LangChain4j | 1.12.2 |
| AI model (cloud) | Google Gemini | gemini-2.5-flash |
| AI model (local) | Ollama | mistral:7b |
| API docs | SpringDoc OpenAPI | 2.8.8 |
| Monitoring | Micrometer + Prometheus | via Spring Boot BOM |
| Scheduler | Quartz | via Spring Boot BOM |
| Email | Spring Mail + Thymeleaf | via Spring Boot BOM |
| Logging | Log4j2 + JSON template | via Spring Boot BOM |

### Frontend

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Package manager | Yarn | — |
| Framework | React | 18 |
| Language | TypeScript | ~5.8.3 |
| Bundler | Vite | ^7.0.5 |
| UI library | Ant Design | ^5.26.5 |
| CSS framework | Tailwind CSS | ^4.1.11 |
| CSS-in-JS | styled-components | ^6.1.19 |
| Global state | MobX + mobx-react-lite | ^6.13.7 |
| Lightweight state | Zustand | ^5.0.8 |
| Server state | TanStack Query | ^5.84.1 |
| Routing | React Router DOM | ^7.7.0 |
| i18n | i18next + react-i18next | ^25.3.2 |
| RBAC | @casl/ability + @casl/react | ^6.7.3 / ^5.0.0 |
| HTTP client | Axios + @hey-api/client-axios | ^1.10.0 / ^0.9.1 |
| OpenAPI codegen | @hey-api/openapi-ts | 0.80.1 |
| WebSocket | @stomp/stompjs + sockjs-client | ^7.0.0 / ^1.6.1 |
| Charts | ECharts + echarts-for-react | ^6.0.0 / ^3.0.6 |
| Maps | Leaflet + react-leaflet | ^1.9.4 / ^4.2.1 |
| Flow diagrams | @xyflow/react + dagre | ^12.10.0 / ^0.8.5 |
| Code editor | CodeMirror 6 | ^6.0.2 |
| Rich text | Quill 2 / Trumbowyg | ^2.0.3 / ^2.31.0 |
| Drag and drop | @dnd-kit | ^6.3.1 |
| Dashboard grid | react-grid-layout | ^2.2.2 |
| Excel (browser) | ExcelJS + xlsx | ^4.4.0 / ^0.18.5 |
| PDF viewer | pdfjs-dist + react-pdf | ^5.4.530 / ^10.3.0 |
| Linting | ESLint | ^9.30.1 |
| Commit hooks | Husky + commitlint | ^9.1.7 / ^19.8.1 |

---

## Key Features

### Multi-Tenancy
Dynamic datasource routing at the `com.clt.hrm.tenant` layer. Each tenant resolves to its own isolated PostgreSQL database at runtime. Controlled by `tenant.datasource.enabled=true`. The tenant metadata database is configured separately in `tenant-metadata-db.properties`.

### Authentication and Authorization
- JWT-based authentication: access tokens expire in 15 minutes (`jwt.expireTime=900000`), refresh tokens last 7 days.
- JWT secrets must be exactly 32 characters; two separate secrets are used for access and refresh tokens.
- Optional Keycloak OAuth2 resource server integration (`keycloak.enabled=false` by default).
- Frontend RBAC via CASL — `@casl/ability` defines permission rules and `@casl/react` enforces them in components.

### Internationalization
`i18next` with `i18next-http-backend` loads translation JSON files from `src/locales/` at runtime. Language switching requires no page reload.

### AI / LLM Integration
LangChain4j 1.12.2 provides a unified abstraction over three LLM backends:
- **Google Gemini** (`gemini-2.5-flash`) — cloud, configured via `langchain4j.google-ai.gemini.api-key`
- **Ollama** (`mistral:7b`) — self-hosted local inference, configured via `langchain4j.ollama.base-url`
- **OpenAI** — standard OpenAI-compatible endpoint
- **Tavily** — web search tool for retrieval-augmented generation
- **OpenRouter** — configurable translation model (`openrouter.enabled=true`)

### Document Generation
| Format | Library | Use case |
|---|---|---|
| PDF (server) | JasperReports 7.0.3 | Print-quality parameterized reports |
| Excel (server) | Apache POI 5.4.1 | Structured spreadsheet export |
| DOCX (server) | docx4j 11.4.9 | Word document generation |
| DOCX/XLSX to PDF | Apache FOP 2.9 | Conversion pipeline |
| Excel (browser) | ExcelJS + xlsx | Client-side workbook generation |
| PDF (browser) | pdfjs-dist + react-pdf | In-browser PDF rendering |
| DOCX (browser) | docx-preview | In-browser Word rendering |

Async Excel export is triggered automatically when result sets exceed `excel.export.async-threshold=10000` rows. Files are staged to `tmp/excel-exports` and retained for up to `excel.export.max-retention-hours=24` hours.

### Real-Time WebSocket
STOMP over SockJS via Spring WebSocket. The frontend `@stomp/stompjs` + `sockjs-client` client connects to `VITE_SOCKET_URL`. Toggle with `websocket.enabled`.

### Monitoring
Micrometer exports metrics to Prometheus at `/actuator/prometheus`. The health endpoint is available at `/actuator/health`.

### Email
Spring Mail with SMTP (pre-configured for Gmail/Google Workspace). Thymeleaf HTML templates are used for email body rendering. Includes a payslip bulk dispatch system with configurable rate limiting and recovery scheduling.

### Rich Component Library
The `src/components/` directory ships with production-ready components: sidebar, drawer, form builder, custom table, modal overlays, report viewer, permission guards, tab bar, and module-specific components under `core/`.

---

## Prerequisites

| Requirement | Minimum version | Notes |
|---|---|---|
| Java | 17 | JDK required for development; JRE sufficient for production container |
| Gradle | 8.13 | Included via the Gradle wrapper — no separate install needed |
| Node.js | 22 | LTS |
| Yarn | 1.x | Classic Yarn used by the frontend Dockerfile |
| PostgreSQL | 14+ | Primary database and per-tenant databases |
| Redis | 6+ | Optional; required when `redis.enabled=true` |
| Docker | 20+ | Optional; required for containerized deployment |

> The Gradle wrapper (`./gradlew`) downloads Gradle 8.13 automatically. A local Gradle installation is not required.

---

## Project Structure

```
react-java/
├── backend/                  # Spring Boot application
│   ├── src/main/java/com/clt/hrm/
│   │   ├── tenant/           # Multi-tenancy: datasource routing, config, aspects
│   │   ├── infra/            # Cross-cutting: files, messaging, export, email, reporting
│   │   ├── core/             # Domain: authentication, administration, scheduled jobs
│   │   ├── publicApi/        # Public and terminal-facing APIs
│   │   └── application/      # Entry: controllers, resolvers
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── tenant-metadata-db.properties
│   │   ├── quartz.properties
│   │   ├── reports/          # JasperReports .jrxml / .jasper files
│   │   └── mappers/          # MyBatis XML mapper files
│   ├── build.gradle
│   ├── Dockerfile
│   └── docker-entrypoint.sh
└── frontend/                 # React SPA
    ├── src/
    │   ├── pages/app/        # Application pages
    │   ├── components/
    │   │   ├── common/       # Shared UI components
    │   │   └── modules/core/ # Module-specific components
    │   ├── stores/modules/   # MobX / Zustand stores (sys, adm, com)
    │   ├── hooks/modules/    # Custom React hooks (sys, adm, com)
    │   ├── services/
    │   │   ├── api/          # API service layer (auto-generated + manual)
    │   │   ├── auth/         # Auth service
    │   │   └── websocket/    # WebSocket service
    │   ├── utils/            # Utility functions
    │   ├── types/            # TypeScript type definitions
    │   ├── locales/          # i18n translation files
    │   ├── constants/        # Application constants
    │   └── configs/          # App configuration
    ├── .env.example
    ├── package.json
    ├── Dockerfile
    └── nginx/nginx.conf
```

---

## Getting Started — Backend

### 1. Clone the repository

```bash
git clone <repository-url>
cd react-java/backend
```

### 2. Configure the application

Open `src/main/resources/application.properties` and update the following required values:

```properties
# Application identity
spring.application.name=posco-gfa

# Primary database
spring.datasource.url=jdbc:postgresql://localhost:5432/your-database
spring.datasource.username=your-username
spring.datasource.password=your-password

# JWT secrets — each must be exactly 32 characters
jwt.access-token-secret=<32-character-secret>
jwt.refresh-token-secret=<32-character-secret>
```

### 3. Run the application

```bash
# From the backend/ directory
./gradlew bootRun
```

The API server starts on `http://localhost:8080`.

To run tests:

```bash
./gradlew test
```

To build a production JAR:

```bash
./gradlew bootJar
```

The output is placed at `build/libs/hrm-x-0.0.1-SNAPSHOT.jar`.

---

## Getting Started — Frontend

### 1. Configure environment variables

```bash
cd react-java/frontend
cp .env.example .env
```

Edit `.env` to point at your running backend:

```env
NODE_ENV=development
VITE_PORT=4000
VITE_API_URL=http://localhost:8080/api
VITE_SOCKET_URL=http://localhost:8080/ws
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Start the development server

```bash
yarn dev
```

The development server starts on `http://localhost:4000`.

### Available scripts

| Script | Description |
|---|---|
| `yarn dev` | Start Vite dev server on port 4000 |
| `yarn build` | Type-check and produce a production build |
| `yarn preview` | Locally preview the production build |
| `yarn lint` | Lint TypeScript source files (zero warnings enforced) |
| `yarn lint:fix` | Lint and auto-fix fixable issues |
| `yarn openapi-ts` | Regenerate the API client from the OpenAPI schema |
| `yarn sync-message` | Synchronize i18n message files |

---

## Environment Configuration

### Backend — `application.properties`

| Property | Default | Description |
|---|---|---|
| `spring.application.name` | `posco-gfa` | Application name, used in logs and metrics |
| `server.port` | `8080` | HTTP server port |
| `spring.datasource.url` | `jdbc:postgresql://...` | Primary PostgreSQL JDBC URL |
| `spring.datasource.username` | `postgres` | Database username |
| `spring.datasource.password` | `postgres` | Database password |
| `jwt.access-token-secret` | — | 32-character secret for access token signing |
| `jwt.refresh-token-secret` | — | 32-character secret for refresh token signing |
| `jwt.expireTime` | `900000` | Access token lifetime in milliseconds (15 minutes) |
| `jwt.cache.ttl` | `3600` | JWT cache time-to-live in seconds |
| `redis.enabled` | `true` | Enable or disable Redis integration |
| `spring.data.redis.host` | `10.0.0.85` | Redis host |
| `spring.data.redis.port` | `6379` | Redis port |
| `kafka.enabled` | `false` | Enable or disable Kafka integration |
| `websocket.enabled` | `false` | Enable or disable WebSocket STOMP |
| `keycloak.enabled` | `false` | Enable or disable Keycloak OAuth2 resource server |
| `tenant.datasource.enabled` | `true` | Enable or disable multi-tenant datasource routing |
| `tracking.enabled` | `true` | Enable or disable user activity tracking |
| `file.upload-dir` | `files/` | Base directory for uploaded files |
| `spring.servlet.multipart.max-file-size` | `10MB` | Maximum size per uploaded file |
| `spring.servlet.multipart.max-request-size` | `50MB` | Maximum total multipart request size |
| `excel.export.async-threshold` | `10000` | Row count above which Excel export runs asynchronously |
| `excel.export.temp-directory` | `tmp/excel-exports` | Staging directory for async Excel export files |
| `langchain4j.google-ai.gemini.api-key` | — | Google AI Gemini API key |
| `langchain4j.google-ai.gemini.model-name` | `gemini-2.5-flash` | Gemini model identifier |
| `langchain4j.ollama.base-url` | `http://...` | Base URL for the Ollama inference server |
| `langchain4j.ollama.model-name` | `mistral:7b` | Ollama model to use for chat |
| `tavily.api-key` | — | Tavily web search API key |
| `openrouter.api-key` | — | OpenRouter API key for translation |
| `openrouter.enabled` | `true` | Enable or disable OpenRouter translation |
| `management.endpoints.web.exposure.include` | `prometheus,health,metrics` | Exposed actuator endpoints |
| `spring.mail.host` | `smtp.gmail.com` | SMTP host for outbound email |
| `spring.mail.port` | `587` | SMTP port |
| `public-api.secret` | _(env var)_ | Secret for public/terminal API authentication |

### Frontend — `.env`

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Node environment |
| `VITE_PORT` | `4000` | Dev server port |
| `VITE_API_URL` | `http://localhost:8080/api` | Backend REST API base URL |
| `VITE_SOCKET_URL` | `http://localhost:8080/ws` | Backend WebSocket endpoint |

---

## Docker Build

### Backend

The backend Dockerfile performs a multi-stage build: Gradle 8.5 compiles the application, and Eclipse Temurin 17 JRE (Jammy) serves as the runtime base. Font rendering libraries required by JasperReports are installed in the runtime stage. The application runs as a non-root `spring` user.

```bash
# Build the image
docker build -t hrm-backend:latest ./backend

# Run the container
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/your-db \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your-password \
  hrm-backend:latest
```

### Frontend

The frontend Dockerfile performs a multi-stage build: Node 22 installs dependencies and Vite produces the production bundle, then Nginx Alpine serves the static assets on port 3000. The API URL is injected at build time via build arguments.

```bash
# Build the image
docker build \
  --build-arg VITE_API_URL=http://your-backend-host/api \
  --build-arg VITE_SOCKET_URL=http://your-backend-host/ws \
  -t hrm-frontend:latest \
  ./frontend

# Run the container
docker run -p 3000:3000 hrm-frontend:latest
```

> `VITE_API_URL` and `VITE_SOCKET_URL` are baked into the static bundle at build time. Rebuild the image whenever these values change.

---

## OpenAPI Code Generation

The frontend API client under `src/services/api/` is generated automatically from the backend OpenAPI schema using `@hey-api/openapi-ts` (version 0.80.1).

### Prerequisites

The backend must be running and the OpenAPI schema must be accessible at `http://localhost:8080/api-docs`.

Ensure `VITE_API_URL` is set correctly in `.env`.

### Regenerate the client

```bash
cd frontend
yarn openapi-ts
```

This reads the OpenAPI configuration (typically `openapi-ts.config.ts` or the `openapi-ts` key in the project config) and writes the generated TypeScript client to the configured output directory.

Re-run this command after any backend API change to keep the frontend type definitions in sync.

---

## Feature Toggles

The following flags in `application.properties` activate or deactivate major infrastructure components without requiring code changes.

| Property | Default | Effect when `true` |
|---|---|---|
| `redis.enabled` | `true` | Activates Redis caching and session storage via Lettuce |
| `kafka.enabled` | `false` | Activates Kafka producer/consumer beans |
| `websocket.enabled` | `false` | Activates the WebSocket STOMP broker endpoint |
| `keycloak.enabled` | `false` | Activates Keycloak OAuth2 resource server in place of local JWT validation |
| `tenant.datasource.enabled` | `true` | Activates per-tenant dynamic datasource routing |
| `tracking.enabled` | `true` | Activates user activity and audit trail tracking |
| `openrouter.enabled` | `true` | Activates OpenRouter as the translation backend |

Set any flag to `false` to disable the corresponding component. The application starts and operates normally with the component absent from the infrastructure.

---

## API Documentation

When the backend is running, the following URLs are available:

| Resource | URL |
|---|---|
| Swagger UI (interactive) | `http://localhost:8080/swagger-ui.html` |
| OpenAPI JSON schema | `http://localhost:8080/api-docs` |

The SpringDoc configuration scans `com.clt.hrm` and matches all paths under `/api/**`. Operations are sorted by HTTP method and tags are sorted alphabetically.

---

## Monitoring

Prometheus metrics are exposed by the Spring Boot Actuator at:

```
http://localhost:8080/actuator/prometheus
```

The health endpoint is available at:

```
http://localhost:8080/actuator/health
```

General metrics are available at:

```
http://localhost:8080/actuator/metrics
```

Point a Prometheus scrape target at `/actuator/prometheus` and connect a Grafana instance to the Prometheus data source to build dashboards.

---

## Customization Guide

When starting a new project from this boilerplate, update the following in priority order.

### 1. Application identity

In `backend/build.gradle`:

```groovy
archivesBaseName = 'your-project-name'   // replaces 'hrm-x'
group = 'com.yourcompany.yourapp'        // replaces 'com.clt.hrm'
version = '1.0.0-SNAPSHOT'
```

In `backend/src/main/resources/application.properties`:

```properties
spring.application.name=your-project-name
```

Rename the root Java package from `com.clt.hrm` to match your `group` value and update all import statements accordingly.

### 2. Database configuration

```properties
spring.datasource.url=jdbc:postgresql://your-host:5432/your-database
spring.datasource.username=your-username
spring.datasource.password=your-password
```

Update `tenant-metadata-db.properties` with the connection details for your tenant registry database.

### 3. JWT secrets

Replace both secrets with random 32-character strings. Never commit real secrets to version control.

```properties
jwt.access-token-secret=<generate-32-char-random-string>
jwt.refresh-token-secret=<generate-32-char-random-string>
```

### 4. AI / LLM keys

Replace the placeholder keys with your own credentials. Remove any keys for services you are not using.

```properties
langchain4j.google-ai.gemini.api-key=your-gemini-key
tavily.api-key=your-tavily-key
openrouter.api-key=your-openrouter-key
```

### 5. Email configuration

```properties
spring.mail.host=your-smtp-host
spring.mail.port=587
spring.mail.username=your-email@yourdomain.com
spring.mail.password=your-smtp-password
```

### 6. Redis and optional services

Set `redis.enabled=false` if your deployment does not include Redis. The application will start without it. Apply the same pattern for `kafka.enabled`, `websocket.enabled`, and `keycloak.enabled`.

### 7. Frontend API URL

Update `frontend/.env` and the `VITE_API_URL` / `VITE_SOCKET_URL` Docker build arguments to point at your deployed backend.

### 8. Public API secret

Set a strong random value for `public-api.secret` or supply it via the `PUBLIC_API_SECRET` environment variable:

```properties
public-api.secret=${PUBLIC_API_SECRET:}
```

---

## License

Internal use only. Not licensed for distribution outside the organization.
