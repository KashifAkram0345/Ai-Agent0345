import { cookies, headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

const SESSION_COOKIE = "nova_session";
const SESSION_HEADER = "x-nova-session";

export async function requireSession() {
  const requestCookies = await cookies();
  const requestHeaders = await headers();
  const anonymousId = requestCookies.get(SESSION_COOKIE)?.value ?? requestHeaders.get(SESSION_HEADER);

  if (!anonymousId || !/^[0-9a-f-]{36}$/i.test(anonymousId)) return null;

  await connectToDatabase();
  return User.findOneAndUpdate(
    { anonymousId },
    {
      $setOnInsert: {
        anonymousId,
        email: `${anonymousId}@anonymous.nova`,
        name: "Guest",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}