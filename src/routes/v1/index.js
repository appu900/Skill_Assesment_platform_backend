import express from "express";

import AdminController from "../../controller/Admin-controller.js";
import TrainingPartnerController from "../../controller/TrainingPartner-controller.js";
import verifyIsAdmin from "../../middleware/verifyAdmin.js";
import verifyIsTrainingPartner from "../../middleware/verifyTrainingPartner.js";
import { createTrainer, deleteTrainer, getAllTrainers, getTrainerById } from "../../controller/Trainer-controller.js";
import { createStudent } from "../../controller/Student-controller.js";
import { addStudentToBatch, addToTrainerToBatch, createBatch, getBatchDetails } from "../../controller/Batch-controller.js";
import { assesmentAgencylogin, createAssesmentAgency, getAllAssesmentAgency, getAssesmentAgencyById, updateAssesmentAgencyStatusToApproved, updateAssesmentAgencyStatusToRejected } from "../../controller/Assesment-agency-controller.js";
import { assignAnExam, getALlExams, getALLExamsBelongsToAnAssesmentAgency } from "../../controller/exam-controller.js";

const router = express.Router();

// ** Admin
router.post("/admin", AdminController.createNewAdmin);
router.post("/admin/login", AdminController.login);




// ** TP
router.post("/tp", TrainingPartnerController.onBoardTrainingPartner);
router.post("/tp/login", TrainingPartnerController.login);




router.get("/tp/:id", TrainingPartnerController.getTrainingPartnerById);
router.get("/tp", TrainingPartnerController.getAllData);

  

router.put("/tp/:id", TrainingPartnerController.updateTrainingPartnerStatus);
router.put(
  "/tp/approve/:id",
  verifyIsAdmin,
  TrainingPartnerController.updateStatusToApproved
);
router.put("/tp/reject/:id", TrainingPartnerController.updateStatusToRejected);




// ** trainer

router.post("/trainer", verifyIsTrainingPartner,createTrainer);
router.get("/trainer",getAllTrainers)
router.get("/trainer/:id",getTrainerById)
router.delete("/trainer/:id",deleteTrainer)

// ** student

router.post("/student",verifyIsTrainingPartner,createStudent)



//** batch routes  */

router.post("/batch/create",verifyIsTrainingPartner,createBatch);
router.post("/batch/addstudent/:id",verifyIsTrainingPartner,addStudentToBatch)
router.post("/batch/addtrainer/:id",verifyIsTrainingPartner,addToTrainerToBatch)
router.get("/batch/:id",getBatchDetails)


// *** assesment agency 

router.post("/aa/create",createAssesmentAgency)
router.post("/aa/login",assesmentAgencylogin)
router.put("/aa/approve/:id",verifyIsAdmin,updateAssesmentAgencyStatusToApproved)
router.put("/aa/reject/:id",verifyIsAdmin,updateAssesmentAgencyStatusToRejected)
router.get("/aa/:id",getAssesmentAgencyById)
router.get("/aa",getAllAssesmentAgency)


// ** exam ** will be created by ADMIN

router.post("/exam/create",verifyIsAdmin,assignAnExam);
router.get("/exam/all",getALlExams)
router.get("/exam/aa/:id",getALLExamsBelongsToAnAssesmentAgency)


export default router;





  

