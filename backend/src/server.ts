import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  try {
    console.log("[Server] Connecting to MongoDB database...");
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`========================================`);
      console.log(`  KRAM Backend Server is running!       `);
      console.log(`  Environment: ${env.NODE_ENV}          `);
      console.log(`  Port:        ${env.PORT}              `);
      console.log(`  Health:      http://localhost:${env.PORT}/api/health`);
      console.log(`========================================`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("[Server] Fatal error during startup:", error);
    process.exit(1);
  }
}

bootstrap();
