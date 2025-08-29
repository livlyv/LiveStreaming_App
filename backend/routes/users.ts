import { Hono } from "hono";

export type User = {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  followers: number;
  following: number;
  likes: number;
  coins: number;
};

const users = new Map<string, User>();

const seed: User = {
  id: "u_1",
  username: "demo_streamer",
  avatarUrl: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=256&auto=format&fit=crop",
  bio: "Welcome to my stream!",
  followers: 1200,
  following: 85,
  likes: 20000,
  coins: 5430,
};
users.set(seed.id, seed);

const router = new Hono();

router.get("/", (c) => {
  return c.json({ users: Array.from(users.values()) });
});

router.get("/:id", (c) => {
  const id = c.req.param("id");
  const user = users.get(id);
  if (!user) return c.json({ error: "not found" }, 404);
  return c.json(user);
});

router.post("/", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<User>;
  if (!body.username) return c.json({ error: "username required" }, 400);
  const id = `u_${Date.now()}`;
  const user: User = {
    id,
    username: body.username,
    avatarUrl: body.avatarUrl,
    bio: body.bio,
    followers: 0,
    following: 0,
    likes: 0,
    coins: 0,
  };
  users.set(id, user);
  return c.json(user, 201);
});

router.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const user = users.get(id);
  if (!user) return c.json({ error: "not found" }, 404);
  const body = (await c.req.json().catch(() => ({}))) as Partial<User>;
  const updated: User = { ...user, ...body, id: user.id };
  users.set(id, updated);
  return c.json(updated);
});

export default router;
