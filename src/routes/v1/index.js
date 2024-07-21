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
  uploadTrainerResultSheet,
} from "../../controller/Trainer-controller.js";

import {
  createStudent,
  getStudentDetails,
  updateProfilePic,
} from "../../controller/Student-controller.js";

// ** assesor

import { createAssessor, getAllAssesor, uploadAssesorMarkSheet } from "../../controller/Assessor-controller.js";

import {
  activeBatch,
  addBatchPaymentAmount,
  addStudentToBatch,
  addToTrainerToBatch,
  bulkTrainersInsertInBatch,
  createBatch,
  getAllBatchData,
  getAllBatchPaymentNotification,
  getAllCorporatePaymentBatch,
  getBatchDetails,
  getFilteredBatchData,
  getIndividualTrainingPartnerBatchDetails,
  updateBatchPaymentStatus,
  uploadBatchPaymentDetails,
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
  assignAssesorToExam,
  fetchAExamDetails,
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
import uploadImage from "../../middleware/imageUpload.js";
import { createPrice } from "../../controller/PriceController.js";
import { createCenter, getAllCentersOfTrainingPartner } from "../../controller/CenterController.js";

const router = express.Router();





// ** Admin
router.post("/admin", AdminController.createNewAdmin);
router.post("/admin/login", AdminController.login);





// ** Center code**

router.post("/center",verifyIsTrainingPartner,createCenter);
router.get("/center/tp/:id",getAllCentersOfTrainingPartner)










// ** TP
router.post("/tp", TrainingPartnerController.onBoardTrainingPartner);
router.post("/tp/login", TrainingPartnerController.login);

router.put("/tp/info/email/:id", TrainingPartnerController.updateEmail);
router.put("/tp/sectors/:id",TrainingPartnerController.updateSector)
router.put("/tp/courses/:id",TrainingPartnerController.updateCourses)

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
router.put("/trainer/marksheet/:id",uploadTrainerResultSheet)


// ** student
router.post("/student", verifyIsTrainingPartner, createStudent);
router.get("/student/:id", getStudentDetails);
router.put("/student/profile/:id",updateProfilePic)




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
router.get("/batch/all/paymentnotification",getAllBatchPaymentNotification)
router.get("/batch/all/corporate",getAllCorporatePaymentBatch)

router.put("/batch/active/:id",activeBatch);
router.put("/batch/addpayment/:id",addBatchPaymentAmount);
router.put("/batch/paymentdetails/:id",uploadBatchPaymentDetails)
router.put("/batch/paymentstatus/:id",updateBatchPaymentStatus)











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
router.put("/exam/addassessor/:id",assignAssesorToExam)

router.get("/exam/:id",fetchAExamDetails)










// ** upload marks
router.post("/marks/upload", verifyAssesmentAgency, createMark);
router.get("/mark/student/:id", getIndividualStudentMarks);
router.get("/mark/batch/:id", getStudentMarksByBatchId);

// router.get("/marks/batch/:id", getMarksOfBatch);
// router.get("/marks/student/:id", getMarksOfStudent);



// ** assessor
router.post("/assessor", uploadImage, createAssessor);
router.put("/assessor/marksheet/:id",uploadAssesorMarkSheet)
router.get("/assessor/aa/:id",getAllAssesor)  




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


// ** Price

router.post("/price",createPrice)

export default router;
