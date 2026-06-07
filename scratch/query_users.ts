import { db } from "../lib/db";
import { crmUsers } from "../lib/db/schema";

async function main() {
  const users = await db.select().from(crmUsers);
  console.log("USERS:", JSON.stringify(users, null, 2));
}

main().catch(console.error);
