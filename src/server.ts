import app from "./app.js";
import config from "./app/config/index.js";
import { prisma } from "./lib/prisma.js";

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully.");

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();


