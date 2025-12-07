// server.js
import express from "express"
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let items = [];    
let nextId = 1;

// Create
app.post("/items", (req, res) => {
  const { name, price } = req.body || {};
  if (!name || typeof price !== "number") {
    return res.status(400).json({ error: "name (string) and price (number) required" });
  }
  const item = { id: nextId++, name, price };
  items.push(item);
  res.status(201).json(item);
});

// Read all
app.get("/items", (req, res) => {
  res.json(items);
});

// Read one
app.get("/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// Update (replace)
app.put("/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const { name, price } = req.body || {};
  if (!name || typeof price !== "number") {
    return res.status(400).json({ error: "name (string) and price (number) required" });
  }
  items[idx] = { id, name, price };
  res.json(items[idx]);
});

// Delete
app.delete("/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = items.length;
  items = items.filter(i => i.id !== id);
  if (items.length === before) return res.status(404).json({ error: "Not found" });
  res.status(204).end();
});

// Basic health check
app.get("/", (_req, res) => res.send("Node CRUD API is running."));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));


