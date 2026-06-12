---
title: "Model-View-Controller (MVC)"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Model-View-Controller (MVC).md"
order: 16
---
**MVC** is an architectural pattern that separates an application into three main components: **Model**, **View**, and **Controller**, each with distinct responsibilities:

* **Model:** The data or business logic of the application. It manages the state, rules, and data persistence (e.g., database entities, domain models).
* **View:** The presentation layer – UI or representation of the model. It displays data to the user and sends user actions (like clicks) to the controller.
* **Controller:** The intermediary that handles user input, interacts with the model, and selects the view to render. It interprets user actions (from the View) and invokes changes on the Model or navigation.

The goal of MVC is to decouple data (Model) from presentation (View), and use controllers to manage the flow, making applications easier to maintain and scale in complexity.

* **Use Cases:** Originally from GUI applications (Smalltalk, then popularized in web frameworks like Ruby on Rails, etc.). In web apps: Model = database + business logic, View = HTML templates, Controller = route handlers that process HTTP requests, update Model, choose a View to render. On the front-end (fullstack context), frameworks have variations (e.g., MVVM, etc., but concept is similar separation). Knowing MVC is fundamental for UI design and also influences API design (e.g., separating data model from API response formatting from request handling logic).

**Example:** In a simplistic web context:

* Model: a `Task` entity with fields and methods to mark complete.
* View: an HTML template or page that shows a list of tasks and a form.
* Controller: `TaskController` with methods like `addTask`, `completeTask` which reads input (maybe from HTTP request), updates the `Task` model (calls model methods or service), and then returns a view or JSON.

Pseudo-code:

```pseudo
// Model
class Task {
   id: number
   title: string
   isDone: boolean
   save() {...}  // persist to DB
}

// View (could be an HTML template string for tasks list)
function renderTasksView(tasks: Task[]): string {
   // generate HTML showing all tasks and their status
}

// Controller
class TaskController {
   // HTTP GET /tasks
   listTasks(request, response) {
      const tasks = Task.findAll();  // get from DB
      response.send(renderTasksView(tasks));
   }
   // HTTP POST /tasks
   addTask(request, response) {
      const title = request.body.title;
      const task = new Task(title);
      task.save();
      response.redirect("/tasks");
   }
   // HTTP POST /tasks/{id}/complete
   completeTask(request, response) {
      const task = Task.findById(request.params.id);
      task.isDone = true;
      task.save();
      response.redirect("/tasks");
   }
}
```

Here the controller does not contain the HTML; it delegates that to the view rendering function. The model is used for data operations. This separation means you can change the view (say, return JSON instead of HTML) without touching model logic. Or change how Task is stored (Model change) without altering how controller routing works (as long as interface remains). It also allows multiple views for the same model (e.g., a web page view and a mobile API view) by reusing the model logic and just having different view/render layers.

MVC and its derivatives (MVP, MVVM, etc.) are key for fullstack developers to decouple front-end or UI logic from business logic. In back-end contexts, it informs the design of web frameworks and APIs. Many frameworks enforce or encourage MVC (e.g., Django’s MTV (Model-Template-View) is a variant, Rails is MVC, etc.).
