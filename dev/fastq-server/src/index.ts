import fastify from "fastify";
import queueRoute from "./routes/queue.js";
import healthRoute from "./routes/health.js";

const server = fastify({
  ignoreTrailingSlash: true,
  logger: {
    transport: {
      target: "@fastify/one-line-logger",
      options: {
        colorize: true,
      },
    },
  },
});

server.get("/", async (request, reply) => {
  const routes = ["/health", "/queue"];
  return { routes };
});

server.register(healthRoute);
server.register(queueRoute);

server.listen({ port: 3001 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Queue server listening at ${address}`);
});
