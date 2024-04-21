import { db } from "./db.js";
import { users } from "./schema.js";

export const getUsers = async () => {
  const result = await db.select().from(users);
  return result;
};
