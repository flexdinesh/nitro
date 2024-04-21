import { Hono } from "hono";

type Bindings = {};

type Variables = {};

export const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

export type Router = typeof router;
