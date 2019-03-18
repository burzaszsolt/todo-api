const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const uuidv1 = require("uuid/v1");

const app = express();

app.use(bodyParser.json());

// Add headers
app.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

const todos = express.Router();
const FILE_NAME = "todos.json";

const getTodos = () => {
  return fs
    .readJson(FILE_NAME)
    .then(todos => {
      return todos;
    })
    .catch(err => {
      return [];
    });
};

todos.get("/", async (req, res) => {
  const todos = await getTodos();
  res.json(todos);
});

todos.get("/:id", async (req, res, next) => {
  const todos = await getTodos();
  if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
    req.message = "Cannot find todo with this identifier|404|NOT_FOUND";
    next(req, res);
  }
  const todo = todos.find(todo => todo.id === req.params.id);
  res.json(todo);
});

todos.post("/", async (req, res) => {
  const todos = await getTodos();
  const newTodo = { ...req.body, id: uuidv1(), completed: false };
  await fs
    .writeJson(FILE_NAME, [...todos, newTodo])
    .then(async () => {
      res.json(newTodo);
    })
    .catch(err => {
      req.message = "Something went wrong";
      next(req, res);
    });
});

todos.put("/:id", async (req, res, next) => {
  const todos = await getTodos();
  if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
    req.message = "Cannot find todo with this identifier|404|NOT_FOUND";
    next(req, res);
    return;
  }
  const newTodos = todos.map(todo =>
    todo.id === req.params.id ? { ...todo, ...req.body } : todo
  );
  await fs
    .writeJson(FILE_NAME, newTodos)
    .then(() => {
      const updatedTodo = newTodos.find(todo => todo.id === req.params.id);
      res.json(updatedTodo);
    })
    .catch(err => {
      req.message = "Something went wrong";
      next(req, res);
    });
});

todos.delete("/all", async (req, res, next) => {
  await fs
    .writeJson(FILE_NAME, [])
    .then(() => {
      res.json([]);
    })
    .catch(err => {
      req.message = "Something went wrong";
      next(req, res);
    });
});

todos.delete("/completed", async (req, res, next) => {
  const todos = await getTodos();
  const completedTodos = todos.filter(todo => todo.completed);
  const newTodos = todos.filter(todo => !todo.completed);
  await fs
    .writeJson(FILE_NAME, newTodos)
    .then(() => {
      res.json(completedTodos);
    })
    .catch(err => {
      req.message = "Something went wrong";
      next(req, res);
    });
});

todos.delete("/:id", async (req, res, next) => {
  const todos = await getTodos();
  if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
    req.message = "Cannot find todo with this identifier|404|NOT_FOUND";
    next(req, res);
  }
  const deletedTodo = todos.find(todo => todo.id === req.params.id);
  const newTodos = todos.filter(todo => todo.id !== req.params.id);
  await fs
    .writeJson(FILE_NAME, newTodos)
    .then(() => {
      res.json(deletedTodo);
    })
    .catch(err => {
      req.message = "Something went wrong";
      next(req, res);
    });
});

app.use("/todos", todos);

app.use((err, req, res, next) => {
  const [
    message,
    status = "500",
    code = "SOMETHING_WENT_WRONG"
  ] = err.message.split("|");
  res.status(status).json({ message, status, code });
});

app.listen(8000, err => {
  fs.ensureFile(FILE_NAME);
  if (!err) console.log("fut a szerver");
});
