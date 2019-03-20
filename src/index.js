const express = require("express");
require("express-async-errors");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const uuidv1 = require("uuid/v1");
const cors = require("cors");
const jsonwebtoken = require("jsonwebtoken");

const app = express();

app.use(bodyParser.json());

app.use(cors());

const todos = express.Router();
const login = express.Router();

const TODOS_FILE_NAME = "todos.json";
const USERS_FILE_NAME = "users.json";
const SECRET = "SUPER_SECRET_KEY";

const getTodos = () => {
  return fs
    .readJson(TODOS_FILE_NAME)
    .then(todos => {
      return todos;
    })
    .catch(err => {
      return [];
    });
};

const getUsers = () => {
  return fs
    .readJson(USERS_FILE_NAME)
    .then(users => {
      return users;
    })
    .catch(err => {
      return [];
    });
};

const getUserByUsername = async username => {
  const users = await getUsers();
  const user = users.find(user => user.username === username);
  return user;
};

const getUserById = async id => {
  const users = await getUsers();
  const user = users.find(user => user.id === id);
  return user;
};

// authentication, authorization

const auth = async (req, res, next) => {
  const jwt = req.get("authorization");
  if (!jwt) throw new Error("Unauthorized|401|UNAUTHORIZED");
  const { userId } = jsonwebtoken.verify(jwt, SECRET);
  if (!userId) throw new Error("Unauthorized|401|UNAUTHORIZED");
  req.user = await getUserById(userId);
  next();
};

const checkPermission = permission => (req, res, next) => {
  if (!req.user.permissions.includes(permission)) throw new Error("Neked nem!|403|FORBIDDEN");
  next();
};

todos.get("/", auth, checkPermission("READ"), async (req, res) => {
  const todos = await getTodos();
  res.json(todos);
});

todos.get("/:id", auth, checkPermission("READ"), async (req, res) => {
  const todos = await getTodos();
  if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
    throw new Error("Cannot find todo with this identifier|404|NOT_FOUND");
  }
  const todo = todos.find(todo => todo.id === req.params.id);
  res.json(todo);
});

todos.post("/", auth, checkPermission("CREATE"), async (req, res) => {
  const todos = await getTodos();
  const newTodo = { ...req.body, id: uuidv1(), completed: false, userId: req.user.id };
  await fs.writeJson(TODOS_FILE_NAME, [...todos, newTodo]);
  res.json(newTodo);
});

todos.put("/:id", auth, checkPermission("UPDATE"), async (req, res, next) => {
  const todos = await getTodos();
  if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
    throw new Error("Cannot find todo with this identifier|404|NOT_FOUND");
  }
  const prevTodo = todos.find(todo => todo.id === req.params.id);
  if (prevTodo.userId !== req.user.id) throw new Error("Unauthorized|401|UNAUTHORIZED");
  const newTodos = todos.map(todo => (todo.id === req.params.id ? { ...todo, ...req.body } : todo));
  await fs.writeJson(TODOS_FILE_NAME, newTodos);
  const updatedTodo = newTodos.find(todo => todo.id === req.params.id);
  res.json(updatedTodo);
});

todos.delete("/all", auth, checkPermission("DELETE"), async (req, res, next) => {
  await fs.writeJson(TODOS_FILE_NAME, []);
  res.json([]);
});

todos.delete("/completed", auth, checkPermission("DELETE"), async (req, res, next) => {
  const todos = await getTodos();
  const completedTodos = todos.filter(todo => todo.completed);
  const newTodos = todos.filter(todo => !todo.completed);
  await fs.writeJson(TODOS_FILE_NAME, newTodos);
  res.json(completedTodos);
});

todos.delete("/:id", auth, checkPermission("DELETE"), async (req, res, next) => {
  const todos = await getTodos();
  if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
    req.message = "Cannot find todo with this identifier|404|NOT_FOUND";
    next(req, res);
  }
  const deletedTodo = todos.find(todo => todo.id === req.params.id);
  if (deletedTodo.userId !== req.user.id) throw new Error("Unauthorized|401|UNAUTHORIZED");
  const newTodos = todos.filter(todo => todo.id !== req.params.id);
  await fs.writeJson(TODOS_FILE_NAME, newTodos);
  res.json(deletedTodo);
});

login.post("/", async (req, res) => {
  const { username, password } = req.body;
  const me = await getUserByUsername(username);
  const jwt = jsonwebtoken.sign({ userId: me.id }, SECRET);
  res.json({ jwt, me });
});

login.put("/", async (req, res) => {
  const { prevJwt } = req.body;
  const { userId } = jsonwebtoken.verify(prevJwt, SECRET);
  const me = await getUserById(userId);
  const jwt = jsonwebtoken.sign({ userId: me.id }, SECRET);
  res.json({ jwt, me });
});

app.use("/todos", todos);
app.use("/login", login);

app.use((err, req, res, next) => {
  const [message, status = "500", code = "SOMETHING_WENT_WRONG"] = err.message.split("|");
  res.status(status).json({ message: status === "500" ? "Something went wrong" : message, status: Number(status), code });
});

app.listen(8000, err => {
  fs.ensureFile(TODOS_FILE_NAME);
  fs.ensureFile(USERS_FILE_NAME);
  if (!err) console.log("fut a szerver");
});
