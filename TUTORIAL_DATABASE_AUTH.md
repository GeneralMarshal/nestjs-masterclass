# Complete Tutorial: Adding Database Persistence & Authentication to In-Memory NestJS App

## Prerequisites

- Existing NestJS app with in-memory storage (arrays in services)
- Controllers and services working with memory
- Basic CRUD operations functional
- PostgreSQL installed and running locally

---

## Part 1: Database Setup (PostgreSQL + TypeORM)

### Step 1: Install Dependencies

**Why:** TypeORM provides database abstraction layer, PostgreSQL driver (`pg`) connects to database, `@nestjs/typeorm` integrates TypeORM with NestJS dependency injection.

```bash
npm install @nestjs/typeorm typeorm pg
```

**Files modified:** `package.json`

---

### Step 2: Configure Database Connection in AppModule

**Why:** `TypeOrmModule.forRoot()` establishes the database connection at app startup. This is a global configuration that makes the database available throughout your app. `autoLoadEntities: true` automatically discovers all `@Entity()` classes so you don't need to manually register them. `synchronize: true` creates/updates tables automatically from your entities (convenient for development, but disable in production).

**File:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// ... your other imports

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'your-database-name', // Change to your database name
      autoLoadEntities: true, // Automatically loads all @Entity() classes
      synchronize: true, // Auto-creates tables (dev only! disable in production)
    }),
    // ... your existing modules
  ],
})
export class AppModule {}
```

**Why each option:**

- `type: 'postgres'` - Specifies PostgreSQL database type
- `host: 'localhost'` - Database server location
- `port: 5432` - PostgreSQL default port
- `username/password` - Database credentials
- `database` - Database name (create it first: `CREATE DATABASE your-database-name;`)
- `autoLoadEntities: true` - Finds all entities automatically (no manual registration needed)
- `synchronize: true` - Creates/updates tables from entities (convenient for dev, disable in production)

**Before creating database:**

```sql
-- Connect to PostgreSQL and run:
CREATE DATABASE your-database-name;
```

---

### Step 3: Create Entity from Your Model

**Why:** Entities define database table structure. TypeORM maps TypeScript classes to database tables. Decorators define columns, relationships, and constraints. This replaces your in-memory model/interface.

**File:** `src/tasks/task.entity.ts` (or your entity file)

**Before (in-memory model/interface):**

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
}
```

**After (database entity):**

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TaskStatus } from './task-status.enum'; // Your existing enum

@Entity('tasks') // Table name in database
export class Task {
  @PrimaryGeneratedColumn('uuid') // Auto-generates UUID primary key
  id: string;

  @Column() // Regular database column
  title: string;

  @Column()
  description: string;

  @Column()
  status: TaskStatus;
}
```

**Why each decorator:**

- `@Entity('tasks')` - Marks class as database table, 'tasks' is the table name
- `@PrimaryGeneratedColumn('uuid')` - Auto-generates UUID primary key (better than auto-increment for distributed systems)
- `@Column()` - Regular database column (stores string, number, etc.)

**Key changes:**

- Interface → Class (entities must be classes)
- Add `@Entity()` decorator
- Add `@PrimaryGeneratedColumn()` for ID
- Add `@Column()` for each property

---

### Step 4: Register Entity in Feature Module

**Why:** `TypeOrmModule.forFeature([Task])` makes `Repository<Task>` available for injection in this module. This enables database operations. Without this, you can't inject the repository in your service.

**File:** `src/tasks/tasks.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './task.entity';
// ... other imports

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]), // Registers Task entity for this module
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
```

**Why:** This enables `@InjectRepository(Task)` in your service. Each feature module registers only the entities it needs.

---

### Step 5: Replace In-Memory Array with Repository

**Why:** Repository provides database methods (find, save, delete). Replaces array operations with SQL queries. Data persists across server restarts.

**File:** `src/tasks/tasks.service.ts`

**Before (in-memory):**

```typescript
@Injectable()
export class TasksService {
  private tasks: Task[] = []; // Lost on server restart

  getAllTasks(): Task[] {
    return this.tasks; // Returns array
  }

  createTask(dto: CreateTaskDto): Task {
    const task = {
      id: uuid(), // Manual ID generation
      ...dto,
      status: TaskStatus.OPEN,
    };
    this.tasks.push(task); // Array operation
    return task;
  }

  getTaskById(id: string): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException();
    }
    return task;
  }

  deleteTask(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
  }
}
```

**After (database):**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
// ... other imports

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) // Injects Repository<Task>
    private tasksRepository: Repository<Task>,
  ) {}

  async getAllTasks(): Promise<Task[]> {
    return this.tasksRepository.find(); // SELECT * FROM tasks
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      // Creates entity instance
      ...dto,
      status: TaskStatus.OPEN,
    });
    return this.tasksRepository.save(task); // INSERT INTO tasks
  }

  async getTaskById(id: string): Promise<Task> {
    const found = await this.tasksRepository.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return found;
  }

  async deleteTask(id: string): Promise<void> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
  }
}
```

**Why each change:**

- `@InjectRepository(Task)` - Gets TypeORM repository for Task entity (dependency injection)
- `Repository<Task>` - Provides all database methods (find, save, delete, etc.)
- `async/await` - Database operations are asynchronous
- `find()` - Executes `SELECT * FROM tasks`
- `create()` - Creates entity instance (in memory, not saved yet)
- `save()` - Persists to database (`INSERT` for new, `UPDATE` for existing)
- `findOne({ where: { id } })` - Finds by condition (`SELECT * FROM tasks WHERE id = ?`)
- `delete(id)` - Deletes from database (`DELETE FROM tasks WHERE id = ?`)
- `result.affected` - Number of rows affected (0 means not found)

**Key differences:**

- Array operations → Database queries
- Synchronous → Asynchronous (add `async/await`)
- Manual ID generation → Auto-generated UUID
- Data lost on restart → Data persists

---

### Step 6: Update All Service Methods

**Why:** Each method needs database operations instead of array operations. Here's the conversion guide:

**Common conversions:**

| In-Memory                             | Database                                          |
| ------------------------------------- | ------------------------------------------------- |
| `this.tasks`                          | `this.tasksRepository.find()`                     |
| `this.tasks.find(t => t.id === id)`   | `this.tasksRepository.findOne({ where: { id } })` |
| `this.tasks.push(task)`               | `this.tasksRepository.save(task)`                 |
| `this.tasks.filter(...)`              | `this.tasksRepository.createQueryBuilder()`       |
| `this.tasks = this.tasks.filter(...)` | `this.tasksRepository.delete(id)`                 |

**Example: Filtering/Searching**

**Before:**

```typescript
getTasksWithFilter(status: TaskStatus): Task[] {
  return this.tasks.filter(task => task.status === status);
}
```

**After:**

```typescript
async getTasksWithFilter(status: TaskStatus): Promise<Task[]> {
  return this.tasksRepository.find({
    where: { status }
  });
}
```

**Complex queries (filtering + searching):**

```typescript
async getTasks(filterDto: GetTasksFilterDto): Promise<Task[]> {
  const { search, status } = filterDto;

  const query = this.tasksRepository.createQueryBuilder('task');

  if (status) {
    query.andWhere('task.status = :status', { status });
  }

  if (search) {
    query.andWhere(
      'LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search)',
      { search: `%${search}%` },
    );
  }

  return query.getMany();
}
```

**Why `createQueryBuilder`:**

- More flexible than `find()`
- Supports complex WHERE clauses
- Better for dynamic filtering
- Supports JOINs, aggregations, etc.

---

## Part 2: Authentication Setup (JWT + Passport)

### Step 7: Install Authentication Dependencies

**Why:**

- `@nestjs/passport` - Integrates Passport with NestJS (strategy pattern)
- `@nestjs/jwt` - JWT token creation and verification
- `passport` - Authentication middleware framework
- `passport-jwt` - JWT strategy for Passport
- `bcrypt` - Password hashing (one-way encryption)
- `@types/*` - TypeScript type definitions

```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt bcrypt
npm install --save-dev @types/passport-jwt @types/bcrypt
```

---

### Step 8: Create User Entity

**Why:** Users need to be stored in database. Entity defines user table structure. Username must be unique to prevent duplicates.

**File:** `src/auth/user.entity.ts`

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users') // Use 'users' not 'user' (PostgreSQL reserved keyword)
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true }) // Username must be unique
  username: string;

  @Column() // Will store hashed password (never plain text!)
  password: string;
}
```

**Why:**

- `unique: true` - Prevents duplicate usernames at database level (enforced by PostgreSQL)
- `password` column stores bcrypt hash, never plain text
- Table name 'users' (plural) avoids PostgreSQL reserved keyword 'user'

---

### Step 9: Create Auth DTOs

**Why:** DTOs validate incoming requests using class-validator decorators. Prevents invalid data from reaching service. Validation happens automatically with ValidationPipe.

**File:** `src/auth/dto/auth-credentials.dto.ts`

```typescript
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class AuthCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is weak',
  })
  password: string;
}
```

**Why each decorator:**

- `@IsString()` - Ensures string type (not number, object, etc.)
- `@MinLength(4)` - Username must be at least 4 characters
- `@MaxLength(20)` - Username max 20 characters
- `@Matches()` - Password must have: uppercase, lowercase, number OR special character

**Password regex explanation:**

- `(?=.*\d)` - At least one digit OR
- `(?=.*\W+)` - At least one special character
- `(?=.*[A-Z])` - At least one uppercase letter
- `(?=.*[a-z])` - At least one lowercase letter

**Note:** Ensure `ValidationPipe` is enabled in `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe());
```

---

### Step 10: Create JWT Payload Interface

**Why:** Defines what data goes in JWT token. Keeps payload structure consistent. Token should contain minimal data (username), full user data comes from database lookup.

**File:** `src/auth/jwt-payload.interface.ts`

```typescript
export interface JwtPayload {
  username: string;
}
```

**Why:**

- Token should be small (sent with every request)
- Only store identifier (username), not sensitive data
- Full user data fetched from database when needed
- Can add more fields later (userId, roles, etc.)

---

### Step 11: Create Auth Service

**Why:** Service contains business logic: password hashing, token creation, user validation. Separates concerns from controller.

**File:** `src/auth/auth.service.ts`

```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signUp(dto: AuthCredentialsDto): Promise<void> {
    const { username, password } = dto;

    // Hash password with salt
    const salt: string = await bcrypt.genSalt();
    const hashedPassword: string = await bcrypt.hash(password, salt);

    // Create user entity
    const user = this.usersRepository.create({
      username,
      password: hashedPassword, // Store hash, not plain text!
    });

    try {
      await this.usersRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        // PostgreSQL unique constraint violation
        throw new ConflictException('Username already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }
  }

  async signIn(dto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    const { username, password } = dto;

    // Find user by username
    const user = await this.usersRepository.findOne({ where: { username } });

    // Verify password
    if (user && (await bcrypt.compare(password, user.password))) {
      // Create JWT payload
      const payload: JwtPayload = { username };

      // Sign and create token
      const accessToken: string = this.jwtService.sign(payload);

      return { accessToken };
    } else {
      throw new UnauthorizedException('Please check your login credentials');
    }
  }
}
```

**Why each part:**

- `bcrypt.genSalt()` - Generates random salt for hashing (prevents rainbow table attacks)
- `bcrypt.hash()` - Hashes password with salt (one-way, can't reverse)
- `bcrypt.compare()` - Verifies password against stored hash (secure comparison)
- `jwtService.sign()` - Creates JWT token with payload and secret
- Error code `23505` - PostgreSQL unique constraint violation (duplicate username)
- `ConflictException` - HTTP 409 (resource conflict)
- `UnauthorizedException` - HTTP 401 (invalid credentials)

**Password security:**

- Never store plain passwords
- Always hash with salt
- Use bcrypt (industry standard)
- One-way hashing (can't decrypt)

---

### Step 12: Create JWT Strategy

**Why:** Strategy validates tokens on protected routes. Extracts user from token and attaches to request. This is the core of authentication - validates token and provides user to controllers.

**File:** `src/auth/jwt-strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      secretOrKey: 'topSecret52', // Must match JwtModule secret
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username } = payload;
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      throw new UnauthorizedException();
    }

    return user; // This becomes request.user automatically!
  }
}
```

**Why:**

- `extends PassportStrategy(Strategy)` - Connects to Passport's JWT system
- `secretOrKey` - Must match JwtModule secret (verifies token signature)
- `jwtFromRequest` - Extracts token from `Authorization: Bearer <token>` header
- `validate()` - Called after token verification, returns user (becomes `request.user`)
- Database lookup - Ensures user still exists (handles deleted users)

**How it works:**

1. Client sends: `Authorization: Bearer <token>`
2. Passport extracts token
3. Passport verifies signature using secret
4. Passport decodes payload: `{ username: "user" }`
5. Passport calls `validate(payload)`
6. `validate()` finds user in database
7. `validate()` returns User object
8. Passport attaches to `request.user`

---

### Step 13: Create Auth Module

**Why:** Module configures Passport, JWT, and database. Exports for use in other modules. This is where everything comes together.

**File:** `src/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './user.entity';
import { JwtStrategy } from './jwt-strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Enables Repository<User>
    PassportModule.register({ defaultStrategy: 'jwt' }), // Registers JWT strategy
    JwtModule.register({
      secret: 'topSecret52', // Must match JwtStrategy secretOrKey
      signOptions: { expiresIn: 3600 }, // Token expires in 1 hour
    }),
  ],
  providers: [AuthService, JwtStrategy], // Registers services
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule], // Exports for other modules
})
export class AuthModule {}
```

**Why each import:**

- `TypeOrmModule.forFeature([User])` - Enables `Repository<User>` injection in AuthService
- `PassportModule.register()` - Registers Passport with JWT as default strategy
- `JwtModule.register()` - Configures JWT token creation (secret, expiration)
- `providers: [JwtStrategy]` - Registers strategy so it can be used
- `exports: [JwtStrategy, PassportModule]` - Makes them available to other modules (like TasksModule)

**Secret matching:**

- `JwtModule.secret` must equal `JwtStrategy.secretOrKey`
- If they don't match, token verification fails
- Use environment variables in production!

---

### Step 14: Create Auth Controller

**Why:** Controller exposes HTTP endpoints for signup and signin. Handles HTTP requests and delegates to service.

**File:** `src/auth/auth.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  async signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('/signin')
  async signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.signIn(authCredentialsDto);
  }
}
```

**Endpoints:**

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login and get token

**Request/Response examples:**

**Signup:**

```json
POST /auth/signup
{
  "username": "john",
  "password": "Password123!"
}

Response: 201 Created (or 409 if username exists)
```

**Signin:**

```json
POST /auth/signin
{
  "username": "john",
  "password": "Password123!"
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Step 15: Create GetUser Decorator (Optional but Recommended)

**Why:** Makes accessing `request.user` cleaner and type-safe in controllers. Instead of `@Req() req` then `req.user`, use `@GetUser() user: User`.

**File:** `src/auth/get-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from './user.entity';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    return request.user;
  },
);
```

**Usage in controller:**

```typescript
@Get()
@UseGuards(AuthGuard())
getAllTasks(@GetUser() user: User) {
  // user is typed as User, not any
  console.log(user.username);
  return this.tasksService.getAllTasks();
}
```

**Why:**

- Cleaner syntax
- Type-safe (TypeScript knows it's User)
- Reusable across controllers
- No need to access `req.user` manually

---

### Step 16: Protect Routes with AuthGuard

**Why:** Guards protect routes, ensuring only authenticated users can access. Intercepts requests before controller methods.

**File:** `src/tasks/tasks.controller.ts`

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../auth/user.entity';
// ... other imports

@Controller('tasks')
@UseGuards(AuthGuard()) // Protects all routes in this controller
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getTasks(@GetUser() user: User) {
    // Access authenticated user
    return this.tasksService.getTasks(user);
  }

  @Post()
  createTask(@Body() dto: CreateTaskDto, @GetUser() user: User) {
    return this.tasksService.createTask(dto, user);
  }
}
```

**Why:**

- `@UseGuards(AuthGuard())` - Intercepts requests, validates token, attaches user
- Can be on controller (all routes) or individual methods
- `AuthGuard()` uses default 'jwt' strategy from PassportModule
- If no token/invalid token → 401 Unauthorized
- If valid → request continues with `request.user` available

**Protection levels:**

- Controller level: All routes protected
- Method level: Only specific routes protected
- No guard: Public route (like signup/signin)

---

### Step 17: Import AuthModule in AppModule

**Why:** Makes authentication available app-wide. Other modules can import AuthModule to use guards.

**File:** `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... database config
    }),
    AuthModule, // Adds authentication
    TasksModule,
  ],
})
export class AppModule {}
```

**Why:** Makes AuthModule available. TasksModule can import AuthModule to use JwtStrategy and PassportModule.

---

### Step 18: Relate Tasks to Users (Optional but Recommended)

**Why:** Users should only see their own tasks. Adds ownership and data isolation.

**File:** `src/tasks/task.entity.ts`

```typescript
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskStatus } from './task-status.enum';
import { User } from '../auth/user.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  status: TaskStatus;

  @ManyToOne(() => User) // Many tasks belong to one user
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string; // Foreign key
}
```

**Why:**

- `@ManyToOne(() => User)` - Database relationship (many tasks to one user)
- `@JoinColumn({ name: 'userId' })` - Foreign key column name
- `userId` - Stores which user owns the task
- Filter tasks by user in service queries

**Update service to filter by user:**

```typescript
async getTasks(user: User): Promise<Task[]> {
  return this.tasksRepository.find({
    where: { userId: user.id }
  });
}

async createTask(dto: CreateTaskDto, user: User): Promise<Task> {
  const task = this.tasksRepository.create({
    ...dto,
    status: TaskStatus.OPEN,
    userId: user.id,  // Associate with user
  });
  return this.tasksRepository.save(task);
}
```

---

## Complete File Structure

```
src/
├── app.module.ts              # Root module (database + auth imports)
├── main.ts                    # App bootstrap (ValidationPipe)
│
├── auth/
│   ├── auth.module.ts        # Auth module configuration
│   ├── auth.service.ts       # Signup, signin logic
│   ├── auth.controller.ts    # POST /signup, POST /signin
│   ├── jwt-strategy.ts       # Token validation strategy
│   ├── user.entity.ts        # User database entity
│   ├── jwt-payload.interface.ts  # Token payload structure
│   ├── get-user.decorator.ts # @GetUser() decorator
│   └── dto/
│       └── auth-credentials.dto.ts  # Username/password validation
│
└── tasks/
    ├── tasks.module.ts       # Tasks module (imports AuthModule)
    ├── tasks.service.ts      # Business logic (uses Repository)
    ├── tasks.controller.ts   # HTTP endpoints (@UseGuards)
    ├── task.entity.ts        # Task database entity
    └── dto/
        ├── create-task.dto.ts
        ├── get-task-filter.dto.ts
        └── update-task-status.dto.ts
```

---

## Summary Checklist

### Database Setup:

- [ ] Install `@nestjs/typeorm typeorm pg`
- [ ] Configure `TypeOrmModule.forRoot()` in AppModule
- [ ] Create database: `CREATE DATABASE your-database-name;`
- [ ] Convert interface/model to Entity with decorators
- [ ] Register entity in feature module with `forFeature()`
- [ ] Replace array with `Repository<Task>` injection
- [ ] Update all service methods to use database (async/await)
- [ ] Test: Data persists after server restart

### Authentication Setup:

- [ ] Install `@nestjs/passport @nestjs/jwt passport passport-jwt bcrypt`
- [ ] Install dev dependencies: `@types/passport-jwt @types/bcrypt`
- [ ] Create User entity with unique username
- [ ] Create AuthCredentialsDto with validation
- [ ] Create JwtPayload interface
- [ ] Create AuthService (signUp with bcrypt, signIn with JWT)
- [ ] Create JwtStrategy with validate() method
- [ ] Create AuthModule (configure Passport, JWT, TypeORM)
- [ ] Create AuthController (POST /signup, POST /signin)
- [ ] Create GetUser decorator
- [ ] Protect routes with `@UseGuards(AuthGuard())`
- [ ] Import AuthModule in AppModule
- [ ] Test: Signup → Signin → Use token in protected route

### Testing:

1. **Signup:** `POST /auth/signup` with username/password
2. **Signin:** `POST /auth/signin` → Get accessToken
3. **Protected route:** `GET /tasks` with `Authorization: Bearer <token>`
4. **Without token:** Should return 401 Unauthorized

---

## Common Issues & Solutions

**Issue:** "relation 'users' does not exist"

- **Solution:** Ensure `synchronize: true` in TypeOrmModule.forRoot() (dev only)

**Issue:** "duplicate key value violates unique constraint"

- **Solution:** Username already exists. This is expected - use different username or handle 409 error

**Issue:** "UnauthorizedException" on protected routes

- **Solution:** Check token is sent as `Authorization: Bearer <token>`, secret matches, user exists

**Issue:** "request.user is undefined"

- **Solution:** Ensure JwtStrategy.validate() returns User object, AuthGuard() is applied

**Issue:** Secret mismatch

- **Solution:** Ensure `JwtModule.secret === JwtStrategy.secretOrKey`

---

## Next Steps

1. **Environment Variables:** Move secrets to `.env` file
2. **Refresh Tokens:** Implement token refresh for better security
3. **Password Reset:** Add forgot password functionality
4. **Roles/Permissions:** Add role-based access control
5. **Email Verification:** Verify user emails
6. **Rate Limiting:** Prevent brute force attacks

---

This tutorial provides a complete guide to convert your in-memory NestJS app to use PostgreSQL database persistence and JWT authentication with Passport, following the same structure as the reference app.
