const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs-extra');

const app = express();

app.use(bodyParser.json());

const todos = express.Router();
const file = 'todos.json';

// TODO: util függvény, ami getTodos néven fut, megpróbálja olvasni, és ha nem sikerül, akkor visszaad egy üres tömböt

todos.get('/', async (req, res) => {
  try {
    const todos = await fs.readJson(file);
    res.json(todos);
  } catch (error) {
    res.send(error);
  }
});

todos.get(
  '/:id',
  (req, res, next) => {
    // TODO: ha nem parseolható az id, akkor dobjunk errort
    req.params.id = Number(req.params.id);
    next();
  },
  (req, res) => {
    // TODO: használjunk mindenol promise interface-t, és kezeljünk hibát try-catch-csel
    // TODO: hogyha nincs ilyen id-jú item, akkor 404-es status-t és errort küldjünk
    // res.status(404).send(new Error('Baj van'))
    fs.readJson(file, (err, todos) => {
      const todo = todos.find(todo => todo.id === req.params.id);
      res.json(todo);
    });
  }
);

todos.post('/', async (req, res) => {
  // TODO: ensure nem jó semmire
  await fs.ensureFile(file);
  const todosJson = await fs.readJson(file, { throws: false });
  const todos = todosJson !== null ? todosJson : [];
  // TODO: id-t adjon a szerver
  // TODO: POST /todos térjen vissza teljes listával
  fs.writeJSON(file, [...todos, req.body], err => {
    if (err) res.send(err);
    res.json({ success: true });
  });
});

todos.put(
  '/:id',
  (req, res, next) => {
    req.params.id = Number(req.params.id);
    next();
  },
  async (req, res) => {
    await fs.ensureFile(file);
    const todosJson = await fs.readJson(file, { throws: false });
    const todos = todosJson !== null ? todosJson : [];
    // TODO: a body az egy delta // { ...todo, ...req.body }
    const newTodos = todos.map(todo => (todo.id === req.params.id ? { ...todo, name: req.body.name } : todo));
    fs.writeJSON(file, newTodos, err => {
      if (err) res.send(err);
      // TODO: visszaköltjük az adott todo-t
      res.json({ success: true });
    });
  }
);

todos.delete('/all', async (req, res) => {
  await fs.ensureFile(file);
  fs.writeJSON(file, [], err => {
    if (err) res.send(err);
    // TODO: visszaküldjük, ami megmaradt
    res.json({ success: true });
  });
});

todos.delete('/completed', async (req, res) => {
  await fs.ensureFile(file);
  const todosJson = await fs.readJson(file, { throws: false });
  const todos = todosJson !== null ? todosJson : [];
  const newTodos = todos.filter(todo => !todo.completed);
  fs.writeJSON(file, newTodos, err => {
    if (err) res.send(err);
    // TODO: visszaküldjük, ami megmaradt
    res.json({ success: true });
  });
});

todos.delete(
  '/:id',
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
      // TODO: visszaköltjük az adott todo-t
      res.json({ success: true });
    });
  }
);

app.use('/todos', todos);

app.listen(8000, err => {
  if (!err) console.log('fut a szerver');
});
