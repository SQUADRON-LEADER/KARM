import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Task Endpoints", () => {
  async function createAuthUserAndProject(email = "taskuser@kram.app") {
    const regRes = await request(app).post("/api/auth/register").send({
      fullName: "Task Owner",
      email,
      password: "password12345",
    });
    const token = regRes.body.data.accessToken;

    const projRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Test Project",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
      });

    return { token, projectId: projRes.body.data.id };
  }

  it("should create, list, and complete tasks", async () => {
    const { token, projectId } = await createAuthUserAndProject("t1@kram.app");

    // Create task
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        projectId,
        name: "Design homepage mockup",
        description: "In Figma",
        priority: "high",
        status: "pending",
        dueDate: "2026-10-15",
        tags: ["design", "ui"],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.name).toBe("Design homepage mockup");
    expect(createRes.body.data.tags).toContain("design");
    const taskId = createRes.body.data.id;

    // List tasks
    const listRes = await request(app)
      .get(`/api/tasks?projectId=${projectId}&priority=high`)
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);

    // Complete task via PATCH
    const completeRes = await request(app)
      .patch(`/api/tasks/${taskId}/complete`)
      .set("Authorization", `Bearer ${token}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe("completed");

    // Delete task
    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);
  });
});
