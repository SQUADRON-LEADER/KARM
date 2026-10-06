import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Dashboard & Security Endpoints", () => {
  it("should calculate accurate dashboard statistics for authenticated user", async () => {
    const regRes = await request(app).post("/api/auth/register").send({
      fullName: "Dashboard User",
      email: "dash@kram.app",
      password: "password12345",
    });
    const token = regRes.body.data.accessToken;

    const projRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Proj 1", status: "in_progress", startDate: "2026-10-01", endDate: "2026-10-31" });

    const projectId = projRes.body.data.id;

    // Create 2 tasks, 1 completed
    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ projectId, name: "Task 1", priority: "high", status: "completed", dueDate: "2026-10-10" });

    await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ projectId, name: "Task 2", priority: "medium", status: "pending", dueDate: "2026-10-20" });

    const dashRes = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.statistics.totalProjects).toBe(1);
    expect(dashRes.body.data.statistics.totalTasks).toBe(2);
    expect(dashRes.body.data.statistics.completedTasks).toBe(1);
    expect(dashRes.body.data.statistics.pendingTasks).toBe(1);
    expect(dashRes.body.data.statistics.projectsInProgress).toBe(1);
    expect(dashRes.body.data.statistics.completionRate).toBe(50);
  });

  it("should enforce strict multi-tenant user isolation and prevent unauthorized access", async () => {
    // User A
    const userARes = await request(app).post("/api/auth/register").send({
      fullName: "User A",
      email: "usera@kram.app",
      password: "password12345",
    });
    const tokenA = userARes.body.data.accessToken;

    const projARes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Secret Project A", startDate: "2026-10-01", endDate: "2026-10-31" });

    const projAId = projARes.body.data.id;

    const taskARes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ projectId: projAId, name: "Secret Task A", dueDate: "2026-10-15" });

    const taskAId = taskARes.body.data.id;

    // User B
    const userBRes = await request(app).post("/api/auth/register").send({
      fullName: "User B",
      email: "userb@kram.app",
      password: "password12345",
    });
    const tokenB = userBRes.body.data.accessToken;

    // User B tries to read User A's project
    const getProjRes = await request(app)
      .get(`/api/projects/${projAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(getProjRes.status).toBe(404);

    // User B tries to update User A's project
    const updateProjRes = await request(app)
      .put(`/api/projects/${projAId}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Hacked Name" });
    expect(updateProjRes.status).toBe(404);

    // User B tries to delete User A's project
    const deleteProjRes = await request(app)
      .delete(`/api/projects/${projAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(deleteProjRes.status).toBe(404);

    // User B tries to read User A's task
    const getTaskRes = await request(app)
      .get(`/api/tasks/${taskAId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(getTaskRes.status).toBe(404);

    // User B tries to create task in User A's project
    const createTaskRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ projectId: projAId, name: "Injected Task", dueDate: "2026-10-20" });
    expect(createTaskRes.status).toBe(404);

    // User B dashboard must be completely empty
    const dashBRes = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(dashBRes.body.data.statistics.totalProjects).toBe(0);
    expect(dashBRes.body.data.statistics.totalTasks).toBe(0);
  });

  it("should reject requests with invalid or missing tokens", async () => {
    const noTokenRes = await request(app).get("/api/projects");
    expect(noTokenRes.status).toBe(401);

    const badTokenRes = await request(app)
      .get("/api/projects")
      .set("Authorization", "Bearer invalid.jwt.token");
    expect(badTokenRes.status).toBe(401);
  });

  it("should reject invalid ObjectId formats with 400 Bad Request", async () => {
    const userRes = await request(app).post("/api/auth/register").send({
      fullName: "Valid User",
      email: "valid@kram.app",
      password: "password12345",
    });
    const token = userRes.body.data.accessToken;

    const res = await request(app)
      .get("/api/projects/not-a-valid-object-id")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
