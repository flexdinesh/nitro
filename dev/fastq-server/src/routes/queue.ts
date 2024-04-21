import { type FastifyPluginCallback } from "fastify";
import { Payload, q } from "../q.js";

function validatePayload(body: unknown): Payload | null {
  if (
    typeof body === "object" &&
    body !== null &&
    "request" in body &&
    typeof body.request === "object" &&
    body.request !== null &&
    "url" in body.request &&
    typeof body.request.url === "string" &&
    "host" in body.request &&
    typeof body.request.host === "string" &&
    "path" in body.request &&
    typeof body.request.path === "string" &&
    "method" in body.request &&
    typeof body.request.method === "string" &&
    // "queryString" in body.request &&
    // typeof body.request.queryString === "string" &&
    "headers" in body.request &&
    typeof body.request.headers === "object" &&
    body.request.headers !== null
  ) {
    return {
      request: {
        ...body.request,
        url: body.request.url,
        host: body.request.host,
        path: body.request.path,
        method: body.request.method,
        headers: body.request.headers,
      },
    };
  }

  return null;
}

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
const routes: FastifyPluginCallback = async (fastify, options) => {
  fastify.post("/queue", async (req, reply) => {
    const payload = validatePayload(req.body);
    if (!payload) {
      return reply.status(400).send("payload incorrect");
    }

    console.log("Received in queue", { url: payload.request.url });
    q.push(payload).catch((err) => console.error(err));
    return reply.status(202).send(null);
  });
};

export default routes;
