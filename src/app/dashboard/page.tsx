
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // @ts-ignore
    const role = session.user.role;

    if (role === 'renter') {
        redirect("/renter");
    } else if (role === 'landlord' || role === 'manager') {
        redirect("/landlord");
    } else {
        // Default fallback
        return (
            <main className="container" style={{ paddingTop: '4rem' }}>
                <h1>Dashboard</h1>
                <p>Welcome, {session.user.name || session.user.email}!</p>
                <p className="text-sm text-gray-500">Role: {role || 'Acccount'}</p>
            </main>
        );
    }
}
