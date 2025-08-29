import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import auth from "./routes/auth";
import meta from "./routes/meta";
import users from "./routes/users";
import streaming from "./routes/streaming";
import media from "./routes/media";
import notifications from "./routes/notifications";
import payments from "./routes/payments";
import analytics from "./routes/analytics";
import kyc from "./routes/kyc";

const app = new Hono();

app.use("*", cors());

app.route("/auth", auth);
app.route("/meta", meta);
app.route("/users", users);
app.route("/streaming", streaming);
app.route("/media", media);
app.route("/notifications", notifications);
app.route("/payments", payments);
app.route("/analytics", analytics);
app.route("/kyc", kyc);

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;