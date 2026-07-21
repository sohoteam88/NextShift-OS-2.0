import { createServer } from "node:http";
import { writeFileSync } from "node:fs";

const [controlFile, scenario] = process.argv.slice(2);

if (!controlFile || !scenario) {
  process.exit(2);
}

const respond = (res, status, body, contentType = "application/json") => {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
};

const server = createServer((req, res) => {
  if (req.url === "/api/v1/health") {
    if (scenario === "timeout") {
      setTimeout(
        () =>
          respond(
            res,
            200,
            JSON.stringify({ status: "ok", services: { database: "ok" } }),
          ),
        2_000,
      );
      return;
    }
    if (scenario === "readiness-503") {
      respond(
        res,
        503,
        JSON.stringify({ status: "degraded", services: { database: "error" } }),
      );
      return;
    }
    if (scenario === "readiness-degraded") {
      respond(
        res,
        200,
        JSON.stringify({ status: "degraded", services: { database: "error" } }),
      );
      return;
    }
    if (scenario === "malformed") {
      respond(res, 200, "{not-json");
      return;
    }
    respond(
      res,
      200,
      JSON.stringify({ status: "ok", services: { database: "ok" } }),
    );
    return;
  }

  if (req.url === "/api/health") {
    respond(res, 200, JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/api/v1/version") {
    respond(res, 200, JSON.stringify({ version: "fixture" }));
    return;
  }

  if (req.url === "/login") {
    respond(res, 200, "<html>login</html>", "text/html");
    return;
  }

  respond(res, 404, JSON.stringify({ status: "not-found" }));
});

server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  writeFileSync(controlFile, `http://127.0.0.1:${address.port}\n`, {
    mode: 0o600,
  });
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
