import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
    route("login", "routes/login.tsx"),
    route("logout", "routes/logout.tsx"),

    layout("routes/_protected.tsx", [
        index("routes/home.tsx"), // We will create a home route that just redirects
        route("dashboard", "routes/dashboard.tsx"),
        route("inspection/new", "routes/new-inspection.tsx"),
        route("inspection/:id", "routes/view-inspection.$id.tsx"),
    ]),
] satisfies RouteConfig;
