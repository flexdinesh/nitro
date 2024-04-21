import { faker } from "@faker-js/faker";

import { db } from "../src/db/db.js";
import { users } from "../src/db/schema.js";

async function seed() {
  for (let i = 1; i <= 100; i++) {
    await db.insert(users).values({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    });
  }
}

(async () => {
  await seed();
})().catch((err) => {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(err);
  }
  process.exit(1);
});
