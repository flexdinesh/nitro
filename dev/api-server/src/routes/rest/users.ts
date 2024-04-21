import { type FastifyPluginCallback } from "fastify";
import {getUsers} from '../../db/users.js'

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
const routes: FastifyPluginCallback = async (fastify, options) => {
  fastify.get("/rest/users", async (request, reply) => {
    const users = await getUsers();
    return users;
  });

  fastify.get("/rest/users/nocache", async (request, reply) => {
    const users = await getUsers();
    return users;
  });

  fastify.get("/rest/users/swr", async (request, reply) => {
    const users = await getUsers();
    return users;
  });
};

export default routes;
