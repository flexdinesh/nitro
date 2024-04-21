import fastify from "fastify";
import pingRoute from "./routes/ping.js";
import healthRoute from "./routes/health.js";
import yogaRoute from "./routes/yoga.js";
import usersRoutes from "./routes/rest/users.js";

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
  const routes = ["/ping", "/health", "/yoga", "/rest/users"];
  return { routes };
});

server.register(pingRoute);
server.register(healthRoute);
server.register(yogaRoute);
server.register(usersRoutes);

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`API server listening at ${address}`);
});
