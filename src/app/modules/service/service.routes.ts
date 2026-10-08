import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createServiceSchema, updateServiceSchema } from "./service.validation";
import { serviceController } from "./service.controller";
import { upload } from "../../lib/multer";

const router = Router();

router.post(
  "/",
  auth(Role.ADMIN),
  upload.single("image"),
  validateRequest(createServiceSchema),
  serviceController.createService,
);

router.get("/", serviceController.getActiveServices);

router.get("/all", auth(Role.ADMIN), serviceController.getAllServices);

router.get("/:id", serviceController.getServiceById);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  upload.single("image"),
  validateRequest(updateServiceSchema),
  serviceController.updateService,
);

export const serviceRoutes = router;
