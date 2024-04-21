import SchemaBuilder from "@pothos/core";
import {getUsers} from '../db/users.js'

const builder = new SchemaBuilder({});

const User = builder.objectRef<{
  id: number;
  firstName: string;
  lastName: string;
  createdAt: Date | null;
}>("User");

builder.objectType(User, {
  description: "Long necks, cool patterns, taller than you.",
  fields: (t) => ({
    id: t.exposeID("id", {}),
    firstName: t.exposeString("firstName", {}),
    lastName: t.exposeString("lastName", {}),
    fullName: t.string({
      resolve: (parent) => `${parent.firstName} ${parent.lastName}`,
    }),
    createdAt: t.string({
      nullable: true,
      resolve: (parent) => parent.createdAt?.toISOString(),
    }),
  }),
});

builder.queryType({
  fields: (t) => ({
    users: t.field({
      type: [User],
      resolve: async () => {
        const users = await getUsers()
        return users;
      },
    }),
    hello: t.string({
      args: {
        name: t.arg.string(),
      },
      resolve: (parent, { name }) => `hello, ${name || "World"}`,
    }),
  }),
});

export const schema = builder.toSchema();
