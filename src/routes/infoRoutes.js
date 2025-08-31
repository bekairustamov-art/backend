import { Router } from "express";
import * as controller from "../controllers/infoController.js";

const router = Router();

// Combined info endpoint
router.get("/", controller.getInfo);

// Socials/description endpoint
router.put("/data", controller.upsertData);

// Phone endpoints
router.get("/phones", controller.getPhones);
router.post("/phones", controller.createPhone);
router.put("/phones/:id", controller.updatePhone);
router.delete("/phones/:id", controller.deletePhone);

// Map endpoints
router.get("/maps", controller.getMaps);
router.post("/maps", controller.createMap);
router.put("/maps/:id", controller.updateMap);
router.delete("/maps/:id", controller.deleteMap);

export const infoRouter = router;