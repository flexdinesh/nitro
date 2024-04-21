import { Hono } from "hono";

type Bindings = {
  TOKEN: string;
};

type Variables = {
  user: {
    id: string;
    name: string
  };
};

export const router = new Hono<{ Bindings: Bindings; Variables: Variables }>();

export type Router = typeof router