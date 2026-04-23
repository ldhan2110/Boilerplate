# BizException Global Exception Handler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `BizException` class and global exception filter so all errors return `{ errorCode, errorType, errorMessage }`, then refactor all services to throw `BizException` instead of NestJS built-in exceptions.

**Architecture:** `BizException` extends `Error` with `errorCode`, `errorType` (`WARN`|`ERROR`), and optional `errorMessage`. A `@Catch()` global filter maps `BizException` to HTTP status (WARN→400, ERROR→500), converts stray `HttpException`s to the same shape, and catches unknown errors as `SYS000001`. Registered in `main.ts`.

**Tech Stack:** NestJS, TypeScript

---

### Task 1: Create BizException class

**Files:**
- Create: `src/infra/common/exceptions/biz.exception.ts`

- [ ] **Step 1: Create the BizException class**

```typescript
// src/infra/common/exceptions/biz.exception.ts
export type BizErrorType = 'WARN' | 'ERROR';

export class BizException extends Error {
  constructor(
    public readonly errorCode: string,
    public readonly errorType: BizErrorType,
    public readonly errorMessage?: string,
  ) {
    super(errorMessage ?? errorCode);
    this.name = 'BizException';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/common/exceptions/biz.exception.ts
git commit -m "feat: add BizException class with errorCode, errorType, errorMessage"
```

---

### Task 2: Create BizExceptionFilter

**Files:**
- Create: `src/infra/common/filters/biz-exception.filter.ts`

- [ ] **Step 1: Create the global exception filter**

```typescript
// src/infra/common/filters/biz-exception.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BizException, BizErrorType } from '../exceptions/biz.exception';

interface BizErrorResponse {
  errorCode: string;
  errorType: BizErrorType;
  errorMessage: string;
}

@Catch()
export class BizExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BizExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.resolve(exception);
    response.status(status).json(body);
  }

  private resolve(exception: unknown): { status: number; body: BizErrorResponse } {
    // 1. BizException — our first-class business error
    if (exception instanceof BizException) {
      return {
        status: exception.errorType === 'WARN' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          errorCode: exception.errorCode,
          errorType: exception.errorType,
          errorMessage: exception.errorMessage ?? '',
        },
      };
    }

    // 2. NestJS HttpException (validation errors, 404s, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : (res as any).message;
      const errorMessage = Array.isArray(message) ? message.join('; ') : (message ?? '');

      return {
        status,
        body: {
          errorCode: `HTTP${String(status).padStart(3, '0')}`,
          errorType: 'ERROR',
          errorMessage,
        },
      };
    }

    // 3. Unknown error
    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : exception);
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        errorCode: 'SYS000001',
        errorType: 'ERROR',
        errorMessage: 'Internal server error',
      },
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/common/filters/biz-exception.filter.ts
git commit -m "feat: add BizExceptionFilter global exception handler"
```

---

### Task 3: Register filter in main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Add the global filter registration**

Add import at top:
```typescript
import { BizExceptionFilter } from '@infra/common/filters/biz-exception.filter';
```

Add after `app.useGlobalPipes(...)`:
```typescript
app.useGlobalFilters(new BizExceptionFilter());
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "feat: register BizExceptionFilter globally in main.ts"
```

---

### Task 4: Refactor users.service.ts

**Files:**
- Modify: `src/apps/administration/users/users.service.ts`

- [ ] **Step 1: Replace imports and all throws**

Replace import line:
```typescript
// OLD
import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace each throw:
- Line 130: `throw new BadRequestException('ADM000001')` → `throw new BizException('ADM000001', 'ERROR')`
- Line 153: `throw new BadRequestException('ADM000002')` → `throw new BizException('ADM000002', 'ERROR')`
- Line 175: `throw new BadRequestException('Old password is required')` → `throw new BizException('ADM000004', 'ERROR', 'Old password is required')`
- Line 179: `throw new UnauthorizedException('Old password is incorrect')` → `throw new BizException('ADM000005', 'ERROR', 'Old password is incorrect')`
- Line 182: `throw new BadRequestException('New passwords do not match')` → `throw new BizException('ADM000006', 'ERROR', 'New passwords do not match')`
- Line 185-187: `throw new BadRequestException('Password must be...')` → `throw new BizException('ADM000007', 'ERROR', 'Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character')`
- Line 217: `throw new BadRequestException('ADM000003')` → `throw new BizException('ADM000003', 'ERROR')`
- Line 238: `throw new BadRequestException('ADM000002')` → `throw new BizException('ADM000002', 'ERROR')`

- [ ] **Step 2: Commit**

```bash
git add src/apps/administration/users/users.service.ts
git commit -m "refactor: replace HttpExceptions with BizException in users.service"
```

---

### Task 5: Refactor roles.service.ts

**Files:**
- Modify: `src/apps/administration/roles/roles.service.ts`

- [ ] **Step 1: Replace imports and all throws**

Replace import:
```typescript
// OLD
import { BadRequestException, Injectable } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throw:
- Line 145: `throw new BadRequestException('ADM000010')` → `throw new BizException('ADM000010', 'ERROR')`

- [ ] **Step 2: Commit**

```bash
git add src/apps/administration/roles/roles.service.ts
git commit -m "refactor: replace HttpExceptions with BizException in roles.service"
```

---

### Task 6: Refactor companies.service.ts

**Files:**
- Modify: `src/apps/administration/companies/companies.service.ts`

- [ ] **Step 1: Replace imports and all throws**

Replace import:
```typescript
// OLD
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace each throw:
- Line 82: `throw new BadRequestException('ADM000016')` → `throw new BizException('ADM000016', 'ERROR')`
- Line 90: `throw new BadRequestException('ADM000017')` → `throw new BizException('ADM000017', 'ERROR')`
- Line 137: `throw new BadRequestException('ADM000104')` → `throw new BizException('ADM000104', 'ERROR')`
- Line 142: `throw new NotFoundException('ADM000104')` → `throw new BizException('ADM000104', 'ERROR')`
- Line 154: `throw new BadRequestException('ADM000107')` → `throw new BizException('ADM000107', 'ERROR')`

- [ ] **Step 2: Commit**

```bash
git add src/apps/administration/companies/companies.service.ts
git commit -m "refactor: replace HttpExceptions with BizException in companies.service"
```

---

### Task 7: Refactor programs.service.ts

**Files:**
- Modify: `src/apps/administration/programs/programs.service.ts`

- [ ] **Step 1: Replace imports and all throws**

Replace import:
```typescript
// OLD
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace each throw:
- Line 84: `throw new BadRequestException('pgmId or pgmCd is required')` → `throw new BizException('PGM000001', 'ERROR', 'pgmId or pgmCd is required')`
- Line 108: `throw new BadRequestException(ERR_PROGRAM_CD_DUPLICATE)` → `throw new BizException(ERR_PROGRAM_CD_DUPLICATE, 'ERROR')`
- Line 188: `throw new BadRequestException(ERR_EMPTY_LIST)` → `throw new BizException(ERR_EMPTY_LIST, 'ERROR')`
- Line 198: `throw new BadRequestException(ERR_ROLE_AUTH_EXISTS)` → `throw new BizException(ERR_ROLE_AUTH_EXISTS, 'ERROR')`
- Line 216: `throw new BadRequestException('pgmId is required')` → `throw new BizException('PGM000002', 'ERROR', 'pgmId is required')`
- Line 229: `throw new BadRequestException(ERR_EMPTY_LIST)` → `throw new BizException(ERR_EMPTY_LIST, 'ERROR')`
- Line 248: `throw new BadRequestException(\`Unknown procFlag: ${dto.procFlag}\`)` → `throw new BizException('COM000009', 'ERROR', \`Unknown procFlag: ${dto.procFlag}\`)`
- Line 258: `throw new BadRequestException(ERR_PROGRAM_NOT_FOUND)` → `throw new BizException(ERR_PROGRAM_NOT_FOUND, 'ERROR')`
- Line 263: `throw new NotFoundException(ERR_PROGRAM_NOT_FOUND)` → `throw new BizException(ERR_PROGRAM_NOT_FOUND, 'ERROR')`
- Line 266: `throw new BadRequestException(ERR_PARENT_NOT_MENU)` → `throw new BizException(ERR_PARENT_NOT_MENU, 'ERROR')`
- Line 332: `throw new BadRequestException('permId is required for delete')` → `throw new BizException('PGM000003', 'ERROR', 'permId is required for delete')`

- [ ] **Step 2: Commit**

```bash
git add src/apps/administration/programs/programs.service.ts
git commit -m "refactor: replace HttpExceptions with BizException in programs.service"
```

---

### Task 8: Refactor auth.service.ts and strategies

**Files:**
- Modify: `src/apps/authentication/auth.service.ts`
- Modify: `src/apps/authentication/strategies/local.strategy.ts`
- Modify: `src/apps/authentication/strategies/jwt.strategy.ts`

- [ ] **Step 1: Refactor auth.service.ts**

Replace import:
```typescript
// OLD
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throws:
- Line 58: `throw new ForbiddenException('Refresh token expired or invalid')` → `throw new BizException('AUT000001', 'ERROR', 'Refresh token expired or invalid')`
- Line 63: `throw new UnauthorizedException('User not found or inactive')` → `throw new BizException('AUT000002', 'ERROR', 'User not found or inactive')`

- [ ] **Step 2: Refactor local.strategy.ts**

Replace import:
```typescript
// OLD
import { Injectable, UnauthorizedException } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throw:
- Line 15: `throw new UnauthorizedException('Invalid credentials')` → `throw new BizException('AUT000003', 'ERROR', 'Invalid credentials')`

- [ ] **Step 3: Refactor jwt.strategy.ts**

Replace import:
```typescript
// OLD
import { Injectable, UnauthorizedException } from '@nestjs/common';
// NEW
import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throw:
- Line 28: `throw new UnauthorizedException()` → `throw new BizException('AUT000004', 'ERROR', 'Unauthorized')`

- [ ] **Step 4: Commit**

```bash
git add src/apps/authentication/auth.service.ts src/apps/authentication/strategies/local.strategy.ts src/apps/authentication/strategies/jwt.strategy.ts
git commit -m "refactor: replace HttpExceptions with BizException in auth module"
```

---

### Task 9: Refactor query-factory infrastructure

**Files:**
- Modify: `src/infra/database/query-factory/transaction-context.ts`
- Modify: `src/infra/database/query-factory/chains/update-chain.ts`
- Modify: `src/infra/database/query-factory/query-factory.service.ts`

- [ ] **Step 1: Refactor transaction-context.ts**

Replace import: remove `NotFoundException` from `@nestjs/common`, add `BizException`:
```typescript
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throw at line 64:
`throw new NotFoundException('Entity not found.')` → `throw new BizException('SYS000002', 'ERROR', 'Entity not found')`

- [ ] **Step 2: Refactor update-chain.ts**

Replace import: remove `NotFoundException` from `@nestjs/common`, add `BizException`:
```typescript
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throw at line 69:
`throw new NotFoundException('Entity not found for merge update.')` → `throw new BizException('SYS000002', 'ERROR', 'Entity not found for merge update')`

- [ ] **Step 3: Refactor query-factory.service.ts**

Replace import: remove `NotFoundException` from `@nestjs/common`, add `BizException`:
```typescript
import { BizException } from '@infra/common/exceptions/biz.exception';
```

Replace throw at line 86:
`throw new NotFoundException('Entity not found.')` → `throw new BizException('SYS000002', 'ERROR', 'Entity not found')`

- [ ] **Step 4: Commit**

```bash
git add src/infra/database/query-factory/transaction-context.ts src/infra/database/query-factory/chains/update-chain.ts src/infra/database/query-factory/query-factory.service.ts
git commit -m "refactor: replace HttpExceptions with BizException in query-factory"
```

---

### Task 10: Build verification

- [ ] **Step 1: Run build**

```bash
npx nest build
```

Expected: no compilation errors.

- [ ] **Step 2: Run existing tests**

```bash
npx jest --passWithNoTests
```

Expected: all tests pass.
