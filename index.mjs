import * as http from "node:http";

import api from "@opentelemetry/api";

const tracer = api.trace.getTracer("bun-opentelemetry", "0.0.0");

// Now, start recording data
const meter = api.metrics.getMeter("bun-opentelemetry", "0.0.0");
const counter = meter.createCounter("requests", {
  description: "Counter of http requests",
});

console.log(`Adding counter with 1`);
counter.add(1, { initial: "true" });

function handleRequest(request, response) {
  const currentSpan = api.trace.getActiveSpan();
  // display traceid in the terminal
  const traceId = currentSpan?.spanContext().traceId;
  console.log(`traceId: ${traceId ?? "missing"}`);
  const span = tracer.startSpan("handleRequest", {
    kind: 1, // server
    attributes: { key: "value" },
  });
  // Annotate our span to capture metadata about the operation
  span.addEvent("invoking handleRequest");

  const body = [];
  request.on("error", (err) => console.log(err));
  request.on("data", (chunk) => body.push(chunk));
  request.on("end", () => {
    // deliberately sleeping to mock some action.
    setTimeout(() => {
      counter.add(1, { pid: process.pid });

      span.end();
      response.end("Hello World!");
    }, 2000);
  });
}

function startServer(port) {
  const server = http.createServer(handleRequest);
  server.listen(port, "127.0.0.1", (err) => {
    if (err) {
      throw err;
    }

    const addressInfo = server.address();
    console.log(
      `Node HTTP listening on ${port} at http://${addressInfo.address}:${addressInfo.port}`
    );
  });
}

startServer(8080);
