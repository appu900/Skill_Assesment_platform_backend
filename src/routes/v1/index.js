import express from "express";

import adminRoutes from "./adminroutes.js"
import centerRouts from "./center.js"
import trainingPartnerRouts from "./tp.js"
import trainerRouts from "./trainer.js"
import studentRouts from "./student.js"
import batchRoutes from "./batch.js"
import invoiceRoutes from "./invoice.js"
import assesmentAgencyRoutes from "./assesmementAgency.js"
import examRoutes from "./exam.js"
import markRoutes from "./marks.js"
import assesorRoutes from "./Assesor.js"
import sectorRouter from "./Sector.js"
import snaRoutes from "./sna.js"
import courseRoutes from "./course.js"
import schemeRoutes from "./Scheme.js"
import priceRouter from "./Price.js"
import certificateRoutes from "./Certificate.js"

const router = express.Router();

router.use("/v1/admin",adminRoutes)
router.use("/v1/center",centerRouts)
router.use("/v1/tp",trainingPartnerRouts)
router.use("/v1/trainer",trainerRouts)
router.use("/v1/student",studentRouts)
router.use("/v1/batch",batchRoutes)
router.use("/v1/invoice",invoiceRoutes)
router.use("/v1/aa",assesmentAgencyRoutes)
router.use("/v1/exam",examRoutes)
router.use("/v1/marks",markRoutes)
router.use("/v1/assessor",assesorRoutes)
router.use("/v1/sector",sectorRouter)
router.use("/v1/sna",snaRoutes)
router.use("/v1/course",courseRoutes)
router.use("/v1/scheme",schemeRoutes)
router.use("/v1/price",priceRouter)
router.use("/v1/certificate",certificateRoutes)

export default router;
