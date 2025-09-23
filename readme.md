# FW - A Class-Based Vue 2 Framework

A lightweight, TypeScript-first framework that provides class-based components, dependency injection, routing, and networking capabilities for Vue 2 applications.

## Features

- 🎯 **Class-based Components** - Write Vue components using TypeScript classes with decorators
- 💉 **Dependency Injection** - Built-in IoC container for managing dependencies
- 🛣️ **File-based Routing** - Simple, declarative routing with parameter support
- 🌐 **HTTP Client** - Promise-based networking with middleware support
- 📡 **Event Bus** - Type-safe pub/sub messaging system
- 🔧 **View Engine** - Seamless integration between class-based components and Vue
- 🎨 **Template Support** - Automatic template resolution and component registration

## Installation

```bash
npm install @derekpitt/fw
```

## Quick Start

### 1. Bootstrap Your Application

```typescript
import { bootstrap, FrameworkConfig } from '@derekpitt/fw';
import { AppComponent } from './components/app';

bootstrap(async (config: FrameworkConfig) => {
  // Register your main application component
  config.startWith(AppComponent);

  // Register other components globally
  config.registerComponents(HomeComponent, AboutComponent);

  // Register service instances
  config.registerInstance(ApiService, new ApiService());

  // Load configuration from JSON
  const appConfig = await config.withConfig(AppConfig, '/config.json');
});
```

### 2. Create Class-Based Components

```typescript
import { prop, needs, inject } from '@derekpitt/fw';
import { MyService } from '../services/my-service';

@needs(MyService)
export class UserComponent {
  @prop('John Doe')
  public name: string;

  @prop(0)
  public age: number;

  constructor(private myService: MyService) {}

  public greet() {
    return `Hello, ${this.name}! You are ${this.age} years old.`;
  }

  public async loadData() {
    const data = await this.myService.fetchUserData();
    // Handle data...
  }

  // Vue lifecycle hooks
  public created() {
    console.log('Component created');
  }

  public attached() {
    console.log('Component mounted');
  }

  public beforeDetach() {
    console.log('Component about to be destroyed');
  }

  public detached() {
    console.log('Component destroyed');
  }

  // Route activation (for routed components)
  public activate(params: unknown) {
    console.log('Route activated with params:', params);
  }

  // Route setup (for routed components)
  public registerRoutes(router: RouterConfig) {
    router.add('/users/:id', UserDetailComponent);
    router.add('/users/:id/edit', UserEditComponent);
  }

  // Computed properties
  public get displayName() {
    return this.name.toUpperCase();
  }

  // Property change watchers
  public nameChanged(newValue: string, oldValue: string) {
    console.log(`Name changed from ${oldValue} to ${newValue}`);
  }
}
```

### 3. Template Integration

Templates are automatically resolved. You can use webpack or other bundlers to handle template imports:

```html
<!-- user-component.html -->
<div class="user-component">
  <h1>{{ displayName }}</h1>
  <p>{{ greet() }}</p>
  <button @click="loadData">Load Data</button>
</div>
```

## API Reference

### Core Framework

#### `bootstrap(callback: (config: FrameworkConfig) => Promise<void>)`

Initializes the framework with the provided configuration.

#### `FrameworkConfig`

Configuration object for setting up your application:

- `startWith(component: Function)` - Sets the root component
- `registerComponents(...components: Function[])` - Registers components globally
- `registerInstance<T>(key: Class<T>, instance: T)` - Registers service instances
- `withConfig<T>(configType: Class<T>, fileName: string)` - Loads configuration from JSON
- `useVuePlugin(plugin)` - Registers Vue plugins

### Dependency Injection

#### `@inject`

Marks a class for dependency injection.

#### `@needs(...dependencies: Class[])`

Specifies dependencies for a class.

```typescript
@needs(ApiService, LoggerService)
export class UserService {
  constructor(
    private api: ApiService,
    private logger: LoggerService
  ) {}
}
```

#### `Container`

- `get<T>(type: Class<T>)` - Resolves an instance
- `use<T>(key: Class<T>, instance: T)` - Registers an instance

### Routing

Routes are configured within components using the `registerRoutes` method. The framework uses a hierarchical routing system where each component can define its own child routes.

#### Component-Based Routing

```typescript
import { RouterConfig } from '@derekpitt/fw';

export class AppComponent {
  // Define routes for this component
  public registerRoutes(router: RouterConfig) {
    router.add('/', HomeComponent);
    router.add('/users', UserListComponent);
    router.add('/users/:id', UserDetailComponent);
    router.add('/admin', AdminComponent, { requiresAuth: true });
  }

  // Called when a route is activated
  public activate(params: unknown) {
    console.log('Route params:', params);
  }
}
```

#### Nested Routing

```typescript
export class UserDetailComponent {
  public registerRoutes(router: RouterConfig) {
    // These routes will be available as /users/:id/profile, /users/:id/posts, etc.
    router.add('/profile', UserProfileComponent);
    router.add('/posts', UserPostsComponent);
    router.add('/posts/:postId', PostDetailComponent);
  }

  public activate(params: unknown) {
    const userId = params.id;
    // Load user data...
  }
}
```

#### Navigation

```typescript
import { Navigator } from '@derekpitt/fw';

@needs(Navigator)
export class MyComponent {
  constructor(private navigator: Navigator) {}

  public goToUser(userId: string) {
    this.navigator.navigate(`/users/${userId}`);
  }

  public goToUserWithQuery(userId: string) {
    this.navigator.navigate(`/users/${userId}`, { tab: 'profile', edit: true });
  }
}
```

#### Route Middleware

```typescript
import { RouterMiddlware, Route, RouterConfig } from '@derekpitt/fw';

export class AuthMiddleware implements RouterMiddlware {
  public navigating(route: Route, fullRoute: string): boolean {
    // Return false to prevent navigation
    if (route.data?.requiresAuth && !this.isAuthenticated()) {
      return false;
    }
    return true;
  }
}

// Register middleware in your component's router setup
export class AppComponent {
  public registerRoutes(router: RouterConfig) {
    router.addMiddleware(AuthMiddleware);
    router.add('/admin', AdminComponent, { requiresAuth: true });
  }
}
```

### Components

#### Property Binding

```typescript
export class MyComponent {
  @prop('default value')
  public title: string;

  @prop(null)
  public user: User;

  @prop([])
  public items: unknown[];
}
```

#### Component Dependency Injection

```typescript
export class MyComponent {
  @provided('defaultValue')
  public injectedValue: string;
}
```

#### Event Handling

```typescript
import { ComponentEventBus } from '@derekpitt/fw';

@needs(ComponentEventBus)
export class MyComponent {
  constructor(private eventBus: ComponentEventBus) {}

  public handleClick() {
    // Emit custom events
    this.eventBus.dispatch('custom-event', { data: 'value' });

    // Update v-model
    this.eventBus.updateModel('new value');
  }
}
```

### Networking

#### Basic Usage

```typescript
import { Network } from '@derekpitt/fw';

@needs(Network)
export class ApiService {
  constructor(private http: Network) {}

  public async getUsers(): Promise<User[]> {
    const { body } = await this.http.get<User[]>('/api/users');
    return body;
  }

  public async createUser(user: CreateUserRequest): Promise<User> {
    const { body } = await this.http.post<User>('/api/users', user);
    return body;
  }

  public async uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await this.http.post('/api/upload', formData);
  }
}
```

#### HTTP Methods

- `get<T>(url: string, params?: NVP): Promise<{headers: NVP, body: T}>`
- `post<T>(url: string, content: unknown, params?: NVP): Promise<{headers: NVP, body: T}>`
- `put<T>(url: string, content: unknown, params?: NVP): Promise<{headers: NVP, body: T}>`
- `patch<T>(url: string, content: unknown, params?: NVP): Promise<{headers: NVP, body: T}>`
- `delete<T>(url: string, params?: NVP): Promise<{headers: NVP, body: T}>`

#### Network Middleware

```typescript
export class AuthRequestMiddleware implements NetworkRequestMiddleware {
  public onRequest(context: RequestContext) {
    const token = localStorage.getItem('auth-token');
    if (token) {
      context.addHeader('Authorization', `Bearer ${token}`);
    }
  }
}

export class LoggingResponseMiddleware implements NetworkResponseMiddleware {
  public onResponse(context: ResponseContext) {
    console.log(`Response: ${context.statusCode}`, context.data);
  }
}

// Register middleware on Network instance
@needs(Network)
export class ApiService {
  constructor(private http: Network) {
    // Register middleware when service is created
    this.http.addMiddleware(AuthRequestMiddleware);
    this.http.addMiddleware(LoggingResponseMiddleware);
  }
}
```

### Event Bus

#### Publishing and Subscribing

```typescript
import { Bus } from '@derekpitt/fw';

// Define event types
export class UserLoggedIn {
  constructor(public user: User) {}
}

export class DataUpdated {
  constructor(public data: unknown) {}
}

@needs(Bus)
export class MyService {
  constructor(private bus: Bus) {}

  public login(user: User) {
    // Publish events
    this.bus.publish(new UserLoggedIn(user));
  }

  public subscribeToEvents() {
    // Subscribe to events
    const subscription = this.bus.subscribe(UserLoggedIn, (event) => {
      console.log('User logged in:', event.user);
    });

    // Dispose subscription when done
    subscription.dispose();
  }
}
```

### Utilities

#### `kebab(name: string): string`

Converts PascalCase to kebab-case.

#### `CloseStack`

Manages a stack of closeable items with ESC key support.

```typescript
import { CloseStack } from '@derekpitt/fw';

const closeStack = new CloseStack();

const modal = closeStack.enroll(() => {
  console.log('Modal closed');
});

// Close this modal
modal.close();

// Close this modal and all above it
modal.closeAbove();
```

## TypeScript Configuration

Add these compiler options to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node"
  }
}
```
