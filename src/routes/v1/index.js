import express from "express";

import AdminController from "../../controller/Admin-controller.js";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import {
  createTrainer,
  deleteTrainer,
  getAllTrainers,
  getAllTrainersOfaTrainingPartner,
  getTrainerById,
} from "../../controller/Trainer-controller.js";

import {
  createStudent,
  getStudentDetails,
} from "../../controller/Student-controller.js";

// ** assesor

import { createAssessor } from "../../controller/Assessor-controller.js";

import {
  addStudentToBatch,
  addToTrainerToBatch,
  bulkTrainersInsertInBatch,
  createBatch,
  getAllBatchData,
  getBatchDetails,
  getFilteredBatchData,
  getIndividualTrainingPartnerBatchDetails,
} from "../../controller/Batch-controller.js";

import {
  assesmentAgencylogin,
  createAssesmentAgency,
  filterAssesmentgency,
  getAllApprovedAssesmentAgency,
  getAllAssesmentAgency,
  getAllPendingAssesmentAgency,
  getAssesmentAgencyById,
  updateAssesmentAgencyStatusToApproved,
  updateAssesmentAgencyStatusToRejected,
} from "../../controller/Assesment-agency-controller.js";

import {
  assignAnExam,
  getALlExams,
  getALLExamsBelongsToAnAssesmentAgency,
} from "../../controller/exam-controller.js";

import {
  createMark,
  getIndividualStudentMarks,
  getStudentMarksByBatchId,
} from "../../controller/marks-upload-controller.js";

// ** sector
import {
  createSector,
  getAllCoursesOfASector,
  getAllSector,
} from "../../controller/sectorController.js";
import {
  createCourse,
  getAllCourses,
} from "../../controller/course-controller.js";
import {
  createScheme,
  fetchAllSchems,
} from "../../controller/Scheme-Controller.js";
import verifyAssesmentAgency from "../../middleware/verifyAssesmentAgency.js";

const router = express.Router();

// ** Admin
router.post("/admin", AdminController.createNewAdmin);
router.post("/admin/login", AdminController.login);

// ** TP
router.post("/tp", TrainingPartnerController.onBoardTrainingPartner);
router.post("/tp/login", TrainingPartnerController.login);

router.put("/tp/info/email/:id", TrainingPartnerController.updateEmail);

router.get("/tp/:id", TrainingPartnerController.getTrainingPartnerById);
router.get("/tp", TrainingPartnerController.getAllData);

router.get(
  "/tp/all/query",
  TrainingPartnerController.filterTrainingPartnerData
);

router.get(
  "/tp/status/pending",
  TrainingPartnerController.getNewTrainingPartnerApplications
);
router.get(
  "/tp/status/approved",
  TrainingPartnerController.getApprovedTrainingPartnerData
);

router.put("/tp/:id", TrainingPartnerController.updateTrainingPartnerStatus);
router.put(
  "/tp/approve/:id",
  verifyIsAdmin,
  TrainingPartnerController.updateStatusToApproved
);
router.put("/tp/reject/:id", TrainingPartnerController.updateStatusToRejected);

// ** trainer

router.post("/trainer", verifyIsTrainingPartner, createTrainer);
router.get("/trainer", getAllTrainers);
router.get("/trainer/:id", getTrainerById);
router.delete("/trainer/:id", deleteTrainer);
router.get("/trainer/tp/:id", getAllTrainersOfaTrainingPartner);

// ** student

router.post("/student", verifyIsTrainingPartner, createStudent);
router.get("/student/:id", getStudentDetails);

//** batch routes  */

router.post("/batch/create", verifyIsTrainingPartner, createBatch);
router.post(
  "/batch/addstudent/:id",
  verifyIsTrainingPartner,
  addStudentToBatch
);
router.post(
  "/batch/addtrainer/:id",
  verifyIsTrainingPartner,
  addToTrainerToBatch
);

router.post("/batch/bulkaddTrainer/:id", bulkTrainersInsertInBatch);

router.get("/batch/:id", getBatchDetails);
router.get(
  "/batch/tp/:trainingPartnerId",
  getIndividualTrainingPartnerBatchDetails
);
router.get("/batch", getAllBatchData);
router.get("/batch/all/query", getFilteredBatchData);

// *** assesment agency

router.post("/aa/create", createAssesmentAgency);
router.post("/aa/login", assesmentAgencylogin);
router.put(
  "/aa/approve/:id",
  verifyIsAdmin,
  updateAssesmentAgencyStatusToApproved
);
router.put(
  "/aa/reject/:id",
  verifyIsAdmin,
  updateAssesmentAgencyStatusToRejected
);

router.get("/aa/:id", getAssesmentAgencyById);
router.get("/aa", getAllAssesmentAgency);
router.get("/aa/status/approved", getAllApprovedAssesmentAgency);
router.get("/aa/status/pending", getAllPendingAssesmentAgency);
router.get("/aa/all/query", filterAssesmentgency);

// ** exam ** will be created by ADMIN

router.post("/exam/create", verifyIsAdmin, assignAnExam);
router.get("/exam/all", getALlExams);
router.get("/exam/aa/:id", getALLExamsBelongsToAnAssesmentAgency);

// ** upload marks

router.post("/marks/upload", verifyAssesmentAgency, createMark);
router.get("/mark/student/:id", getIndividualStudentMarks);
router.get("/mark/batch/:id", getStudentMarksByBatchId);

// router.get("/marks/batch/:id", getMarksOfBatch);
// router.get("/marks/student/:id", getMarksOfStudent);

// ** assessor
router.post("/assessor", createAssessor);

// ** sector **

router.post("/sector", createSector);
router.get("/sector/all", getAllSector);
router.get("/sector", getAllCoursesOfASector);

// ** course ** s

router.post("/course", createCourse);
router.get("/courses", getAllCourses);

// ** scheme

router.post("/scheme", createScheme);
router.get("/scheme", fetchAllSchems);

export default router;
