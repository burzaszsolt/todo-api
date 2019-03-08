const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs-extra");
const uuidv1 = require("uuid/v1");

const app = express();

app.use(bodyParser.json());

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

todos.get(
  "/:id",
  // (req, res, next) => {
  //   req.params.id = Number(req.params.id);
  //   if (isNaN(req.params.id)) {
  //     res.status(400).send(new Error("Wrong id"));
  //     return;
  //   }
  //   next();
  // },
  async (req, res) => {
    const todos = await getTodos();
    if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
      res
        .status(404)
        .send(new Error("The requested resource could not be found."));
      return;
    }
    const todo = todos.find(todo => todo.id === req.params.id);
    res.json(todo);
  }
);

todos.post("/", async (req, res) => {
  const todos = await getTodos();
  await fs
    .writeJson(FILE_NAME, [...todos, { ...req.body, id: uuidv1() }])
    .then(async () => {
      const newTodos = await getTodos();
      res.json(newTodos);
    })
    .catch(err => {
      res.status(500).send(new Error(err));
    });
});

todos.put(
  "/:id",
  // (req, res, next) => {
  //   req.params.id = Number(req.params.id);
  //   if (isNaN(req.params.id)) {
  //     res.status(400).send(new Error("Wrong id"));
  //     return;
  //   }
  //   next();
  // },
  async (req, res) => {
    const todos = await getTodos();
    if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
      res
        .status(404)
        .send(new Error("The requested resource could not be found."));
      return;
    }
    const newTodos = todos.map(todo =>
      todo.id === req.params.id ? { ...todo, ...req.body } : todo
    );
    await fs
      .writeJson(FILE_NAME, newTodos)
      .then(() => {
        res.json(newTodos);
      })
      .catch(err => {
        res.status(500).send(new Error(err));
      });
  }
);

todos.delete("/all", async (req, res) => {
  await fs
    .writeJson(FILE_NAME, [])
    .then(() => {
      res.json([]);
    })
    .catch(err => {
      res.status(500).send(new Error(err));
    });
});

todos.delete("/completed", async (req, res) => {
  const todos = await getTodos();
  const newTodos = todos.filter(todo => !todo.completed);
  await fs
    .writeJson(FILE_NAME, newTodos)
    .then(() => {
      res.json(newTodos);
    })
    .catch(err => {
      res.status(500).send(new Error(err));
    });
});

todos.delete(
  "/:id",
  // (req, res, next) => {
  //   req.params.id = Number(req.params.id);
  //   if (isNaN(req.params.id)) {
  //     res.status(400).send(new Error("Wrong id"));
  //     return;
  //   }
  //   next();
  // },
  async (req, res) => {
    const todos = await getTodos();
    if (todos.findIndex(todo => todo.id === req.params.id) === -1) {
      res
        .status(404)
        .send(new Error("The requested resource could not be found."));
      return;
    }
    const newTodos = todos.filter(todo => todo.id !== req.params.id);
    await fs
      .writeJson(FILE_NAME, newTodos)
      .then(() => {
        res.json(newTodos);
      })
      .catch(err => {
        res.status(500).send(new Error(err));
      });
  }
);

app.use("/todos", todos);

app.listen(8000, err => {
  fs.ensureFile(FILE_NAME);
  if (!err) console.log("fut a szerver");
});
