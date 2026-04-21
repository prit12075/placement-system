import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/DashboardNav";

/** Dashboard layout — guards all /dashboard routes, renders sidebar nav. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardNav email={session.user?.email ?? ""} />
      <main className="flex-1 container py-8 max-w-6xl">{children}</main>
    </div>
  );
}
