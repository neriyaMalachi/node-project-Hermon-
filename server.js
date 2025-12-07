
import http from 'http'
import URL from 'url'
const PORT = process.env.PORT || 3000;

// In-memory "DB"
let items = []; // { id:string, name:string, price:number }

// Helpers
const json = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });

const server = http.createServer(async (req, res) => {
  // Preflight for CORS
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Health
  if (req.method === "GET" && pathname === "/") {
    return json(res, 200, { ok: true, message: "Node (no Express) CRUD is running" });
  }

  // Routes: /items and /items/:id
  const itemsMatch = pathname === "/items";
  const itemIdMatch = /^\/items\/([^/]+)$/.exec(pathname);
  const id = itemIdMatch ? itemIdMatch[1] : null;

  try {
    // CREATE
    if (itemsMatch && req.method === "POST") {
      const body = await readBody(req);
      const { name, price } = body;
      if (!name || typeof price !== "number") {
        return json(res, 400, { error: "name (string) and price (number) required" });
      }
      const item = { id: cryptoRandomId(), name, price };
      items.push(item);
      return json(res, 201, item);
    }

    // READ ALL
    if (itemsMatch && req.method === "GET") {
      return json(res, 200, items);
    }

    // READ ONE
    if (itemIdMatch && req.method === "GET") {
      const item = items.find((i) => i.id === id);
      return item ? json(res, 200, item) : json(res, 404, { error: "Not found" });
    }

    // UPDATE (replace)
    if (itemIdMatch && req.method === "PUT") {
      const idx = items.findIndex((i) => i.id === id);
      if (idx === -1) return json(res, 404, { error: "Not found" });
      const body = await readBody(req);
      const { name, price } = body;
      if (!name || typeof price !== "number") {
        return json(res, 400, { error: "name (string) and price (number) required" });
      }
      items[idx] = { id, name, price };
      return json(res, 200, items[idx]);
    }

    // DELETE
    if (itemIdMatch && req.method === "DELETE") {
      const before = items.length;
      items = items.filter((i) => i.id !== id);
      return before === items.length
        ? json(res, 404, { error: "Not found" })
        : json(res, 204, {});
    }

    // Fallback 404
    json(res, 404, { error: "Route not found" });
  } catch (err) {
    json(res, 500, { error: err.message || "Internal Server Error" });
  }
});

// Small UUID-ish id (works on Node <19)
function cryptoRandomId(len = 12) {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

server.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
