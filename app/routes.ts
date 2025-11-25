import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  route("/login", "routes/login.tsx"),
  route("/verify", "routes/verify-otp.tsx"),
  route("/link-student", "routes/link-student.tsx"),
  route("/", "routes/protected.tsx", [
    index("routes/dashboard.tsx"),
    route("profile", "routes/profile.tsx"),
  ]),
] satisfies RouteConfig;
