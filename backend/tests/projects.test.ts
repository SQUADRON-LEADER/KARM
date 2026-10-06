import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Project Endpoints", () => {
  async function createAuthUser(email = "user@kram.app") {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Test User",
      email,
      password: "password12345",
    });
    return { token: res.body.data.accessToken, user: res.body.data.user };
  }

  it("should create a project", async () => {
    const { token } = await createAuthUser("p1@kram.app");

    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Website Redesign",
        description: "Modern revamp",
        status: "in_progress",
        startDate: "2026-10-01",
        endDate: "2026-11-01",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Website Redesign");
    expect(res.body.data.status).toBe("in_progress");
    expect(res.body.data.id).toBeDefined();
  });

  it("should list projects with search and status filtering", async () => {
    const { token } = await createAuthUser("p2@kram.app");

    await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Alpha Project", startDate: "2026-10-01", endDate: "2026-10-10", status: "not_started" });

    await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Beta Project", startDate: "2026-10-01", endDate: "2026-10-10", status: "in_progress" });

    const listRes = await request(app)
      .get("/api/projects?status=in_progress")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].name).toBe("Beta Project");

    const searchRes = await request(app)
      .get("/api/projects?search=Alpha")
      .set("Authorization", `Bearer ${token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].name).toBe("Alpha Project");
  });

  it("should get, update and delete a project", async () => {
    const { token } = await createAuthUser("p3@kram.app");

    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Original", startDate: "2026-10-01", endDate: "2026-10-10", status: "not_started" });

    const projectId = createRes.body.data.id;

    // Get
    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe("Original");

    // Update
    const updateRes = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name", status: "completed" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe("Updated Name");
    expect(updateRes.body.data.status).toBe("completed");

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    // Verify deletion
    const getAgain = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getAgain.status).toBe(404);
  });
});
