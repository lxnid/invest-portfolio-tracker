import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/views/profile-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your account settings and preferences.",
};

export default async function ProfilePage() {
  const session = await getSession();
  console.log("ProfilePage: Session:", session);

  if (!session) {
    console.log("ProfilePage: No session, redirecting to login");
    redirect("/login");
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  console.log("ProfilePage: DB User result:", user);

  if (!user.length) {
    console.log("ProfilePage: User not found in DB, redirecting to login");
    redirect("/login");
  }

  // Serialize the date for Client Component
  const userData = {
    ...user[0],
    createdAt: user[0].createdAt.toISOString(),
  };

  return <ProfileView initialUser={userData} />;
}
