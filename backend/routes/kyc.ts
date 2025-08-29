import { Hono } from "hono";

const kyc = new Hono();

kyc.get("/status", (c) => {
  return c.json({ status: "unverified" });
});

kyc.post("/submit", async (c) => {
  return c.json({ submitted: true, status: "pending" });
});

export default kyc;
