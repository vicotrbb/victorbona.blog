---
title: "Repository Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Repository Pattern.md"
order: 21
---
The **Repository** pattern is an abstraction over data storage that provides a collection-like interface for accessing domain objects. Instead of the domain/business logic dealing directly with database queries or data access code, it interacts with a repository. The repository handles the nitty-gritty of data retrieval, mapping to domain objects, and persistence, providing methods like `add`, `update`, `findById`, etc. Essentially, it acts like an in-memory collection (even though behind the scenes it may be fetching from a database or an external service).

* **Intent:** Encapsulate data access logic in a separate layer, isolating the rest of the application from the specifics of data sources. This promotes a cleaner domain model and easier testing (you can swap a fake repository for tests).
* **Use Cases:** Common in Domain-Driven Design and layered architecture. For example, in a service-oriented back-end, you might have `UserRepository`, `OrderRepository` interfaces. Business services or controllers call these instead of writing SQL or ORM code inline. Repositories can aggregate data from multiple tables or sources to present as domain objects.

**Example:** Repository for `Task` in a to-do app:

```typescript
// Domain Model
class Task {
  constructor(public id: number, public title: string, public completed: boolean = false) {}
}

// Repository Interface
interface TaskRepository {
  findById(id: number): Task | null;
  findAll(): Task[];
  save(task: Task): void;
  delete(id: number): void;
}

// Concrete implementation (e.g., using an in-memory array for simplicity)
class InMemoryTaskRepository implements TaskRepository {
  private tasks: Task[] = [];
  findById(id: number): Task | null {
    return this.tasks.find(t => t.id === id) || null;
  }
  findAll(): Task[] {
    return [...this.tasks];
  }
  save(task: Task): void {
    const index = this.tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      this.tasks[index] = task;  // update existing
    } else {
      this.tasks.push(task);     // add new
    }
  }
  delete(id: number): void {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }
}

// Usage in business logic:
class TaskService {
  constructor(private repo: TaskRepository) {}
  completeTask(id: number): boolean {
    const task = this.repo.findById(id);
    if (!task) return false;
    task.completed = true;
    this.repo.save(task);
    return true;
  }
}
```

In this code, `TaskService` doesn’t know or care how tasks are stored. It just calls `repo.findById` and `repo.save`. This separation allows:

* Changing the data storage (could switch to a database-backed repository) without changing service code.
* Unit testing `TaskService` by passing in a stub or in-memory repository (as shown).
* Centralizing data access logic (e.g., complex queries) inside the repository.

Often repositories work with an **ORM** (Object-Relational Mapper) under the hood, or directly execute queries. They may also handle transactions or map from database schemas to domain objects (sometimes with Data Mapper or Active Record patterns under the covers).

Repository is a crucial pattern in enterprise apps and backends, as it decouples the domain/business logic from persistence. It aligns with the **single responsibility principle** by giving the persistence logic its own class, and with **dependency inversion** by depending on an abstraction of data access rather than concrete database code in the higher layers.
