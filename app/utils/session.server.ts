import { createCookieSessionStorage, redirect } from "react-router";

type SessionData = {
    userId: string;
};

type SessionFlashData = {
    error: string;
};

export const storage = createCookieSessionStorage<SessionData, SessionFlashData>({
    cookie: {
        name: "__session",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax",
        secrets: ["s3cr3t"], // TODO: Use env
        secure: process.env.NODE_ENV === "production",
    },
});

export const { getSession, commitSession, destroySession } = storage;

export async function requireUserId(request: Request, redirectTo: string = new URL(request.url).pathname) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId) {
        const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
        throw redirect(`/login?${searchParams}`);
    }
    return userId;
}

export async function getUser(request: Request) {
    const session = await getSession(request.headers.get("Cookie"));
    const userId = session.get("userId");
    if (!userId) return null;
    // In a real app we might fetch the user from DB here to ensure they still exist
    return userId;
}
