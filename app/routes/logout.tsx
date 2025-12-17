import { redirect } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { destroySession, getSession } from "../utils/session.server";

export async function action({ request }: ActionFunctionArgs) {
    const session = await getSession(request.headers.get("Cookie"));
    return redirect("/login", {
        headers: {
            "Set-Cookie": await destroySession(session),
        },
    });
}

export async function loader() {
    return redirect("/login");
}
