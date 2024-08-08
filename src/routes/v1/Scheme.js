
import express from 'express';
import { createScheme, fetchAllSchemeOfSchemeType, fetchAllSchems } from '../../controller/Scheme-Controller.js';

const router = express.Router();

router.post("/", createScheme);
router.get("/", fetchAllSchems);
router.get("/query",fetchAllSchemeOfSchemeType)

export default router;