import { Outlet } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { Navbar } from "../components/Navbar";
import { requireUserId } from "../utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
    // requireUserId throws redirect if not found
    await requireUserId(request);
    return null;
}

export default function ProtectedLayout() {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Navbar />
            <div className="flex-1">
                <main className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
