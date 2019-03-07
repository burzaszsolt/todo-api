const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");

const app = express();

app.use(bodyParser.json());

const todos = express.Router();
const file = "todos.json";

todos.get("/", (req, res) => {
  fs.readJson(file, (err, todos) => {
    if (err) res.send(err);
    res.json(todos);
  });
});

todos.get(
  "/:id",
  (req, res, next) => {
    req.params.id = Number(req.params.id);
    next();
  },
  (req, res) => {
    fs.readJson(file, (err, todos) => {
      const todo = todos.find(todo => todo.id === req.params.id);
      res.json(todo);
    });
  }
);

todos.post("/", async (req, res) => {
  await fs.ensureFile(file);
  const todosJson = await fs.readJson(file, { throws: false });
  const todos = todosJson !== null ? todosJson : [];
  fs.writeJSON(file, [...todos, req.body], err => {
    if (err) res.send(err);
    res.json({ success: true });
  });
});

todos.put(
  "/:id",
  (req, res, next) => {
    req.params.id = Number(req.params.id);
    next();
  },
  async (req, res) => {
    await fs.ensureFile(file);
    const todosJson = await fs.readJson(file, { throws: false });
    const todos = todosJson !== null ? todosJson : [];
    const newTodos = todos.map(todo =>
      todo.id === req.params.id ? { ...todo, name: req.body.name } : todo
    );
    fs.writeJSON(file, newTodos, err => {
      if (err) res.send(err);
      res.json({ success: true });
    });
  }
);

todos.delete("/all", (req, res) => {
  fs.writeJSON(file, [], err => {
    if (err) res.send(err);
    res.json({ success: true });
  });
});

todos.delete("/completed", async (req, res) => {
  await fs.ensureFile(file);
  const todosJson = await fs.readJson(file, { throws: false });
  const todos = todosJson !== null ? todosJson : [];
  const newTodos = todos.filter(todo => !todo.completed);
  fs.writeJSON(file, newTodos, err => {
    if (err) res.send(err);
    res.json({ success: true });
  });
});

todos.delete(
  "/:id",
  (req, res, next) => {
    req.params.id = Number(req.params.id);
    next();
  },
  async (req, res) => {
    await fs.ensureFile(file);
    const todosJson = await fs.readJson(file, { throws: false });
    const todos = todosJson !== null ? todosJson : [];
    const newTodos = todos.filter(todo => todo.id !== req.params.id);
    fs.writeJSON(file, newTodos, err => {
      if (err) res.send(err);
      res.json({ success: true });
    });
  }
);

app.use("/todos", todos);

app.listen(8000, err => {
  if (!err) console.log("fut a szerver");
});
