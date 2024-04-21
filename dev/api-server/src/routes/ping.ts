import { type FastifyPluginCallback } from "fastify";
/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
const routes: FastifyPluginCallback = async (fastify, options) => {
  fastify.get("/ping", async (request, reply) => {
    return "pong\n";
  });
};

export default routes;
