import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Auth Endpoints", () => {
  const testUser = {
    fullName: "Alex Rivera",
    email: "alex@example.com",
    password: "password12345",
  };

  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.fullName).toBe(testUser.fullName);
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should prevent duplicate registration with the same email", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("should login registered user with valid credentials", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.accessToken).toBeDefined();
  });

  it("should reject invalid login credentials with 401 without revealing user existence", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res1 = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });

    expect(res1.status).toBe(401);
    expect(res1.body.message).toBe("Invalid email or password.");

    const res2 = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexistent@example.com", password: "somepassword" });

    expect(res2.status).toBe(401);
    expect(res2.body.message).toBe("Invalid email or password.");
  });

  it("should get current authenticated user profile via /api/auth/me", async () => {
    const regRes = await request(app).post("/api/auth/register").send(testUser);
    const token = regRes.body.data.accessToken;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe(testUser.email.toLowerCase());
    expect(meRes.body.data.id).toBeDefined();
    expect(meRes.body.data.password).toBeUndefined();
    expect(meRes.body.data.passwordHash).toBeUndefined();
  });

  it("should refresh tokens using valid refresh cookie", async () => {
    const regRes = await request(app).post("/api/auth/register").send(testUser);
    const cookies = regRes.headers["set-cookie"];

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", cookies);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.user.email).toBe(testUser.email.toLowerCase());
  });

  it("should logout successfully and clear refresh cookie", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
