import express from "express";
import { allow, ROLES } from "../../middleware/auth.js";
import { deleteConfig, getConfigs, getSettingKeys, resolveConfig, saveConfig } from "../../controller/Config-controller.js";

const router = express.Router();

// ** platform settings (stored in mongodb, served from redis); admin only
router.get("/keys", allow(ROLES.ADMIN), getSettingKeys);
router.get("/resolve", allow(ROLES.ADMIN), resolveConfig);
router.get("/", allow(ROLES.ADMIN), getConfigs);
router.put("/", allow(ROLES.ADMIN), saveConfig);
router.delete("/:id", allow(ROLES.ADMIN), deleteConfig);

export default router;
