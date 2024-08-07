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
  markStudentAbsent,
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
  getAllBatchesBySchemeName,
  getAllBatchPaymentNotification,
  getAllCorporatePaymentBatch,
  getAllGovernmentBatchesStateAndScehmeWise,
  getAllStudentCertificate,
  getBatchDetails,
  getFilteredBatchData,
  getIndividualTrainingPartnerBatchDetails,
  getPaymentApprovalForGovernemtBatches,
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
  updateBankDetails,
} from "../../controller/Assesment-agency-controller.js";

import {
  addAssesmentDate,
  assignAnExam,
  assignAssesorToExam,
  changeExamCompleteStatus,
  fetchAExamDetails,
  getALlExams,
  getALLExamsBelongsToAnAssesmentAgency,
  getAttendanceSheetForExam,
  publishResult,
  updateExamPaymentStatus,
  updateStudentAttendanceNumber,
  uploadPhotos,
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
  fetchAllSchemeOfSchemeType,
  fetchAllSchems,
} from "../../controller/Scheme-Controller.js";
import verifyAssesmentAgency from "../../middleware/verifyAssesmentAgency.js";
import uploadImage from "../../middleware/imageUpload.js";
import { createPrice } from "../../controller/PriceController.js";
import { approveCenter, createCenter, filterCenterBySchemeAndState, getAllApprovedCentersByScheme, getAllCentersOfTrainingPartner } from "../../controller/CenterController.js";
import { generateMonthlyInvoice, getInvoicesOfAssesmentAgency, getMonthlyInvoice, updateAssesmentAgencyPdf, updatePaymentStatusOfInvoice } from "../../controller/Assesment-agency-invoice-controller.js";
import sendMessages from "../../controller/queue.js";
import { approveGovernmentSchemeBatches, createSNA, snaLogin } from "../../controller/SnaController.js";

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
router.put("/student/absent/:id",markStudentAbsent)




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
router.get("/batch/all/payment/gov",getPaymentApprovalForGovernemtBatches)

router.put("/batch/active/:id",activeBatch);
router.put("/batch/addpayment/:id",addBatchPaymentAmount);
router.put("/batch/paymentdetails/:id",uploadBatchPaymentDetails)
router.put("/batch/paymentstatus/:id",updateBatchPaymentStatus)




// ** Generate monthly Invoice

router.post("/invoice/:id",generateMonthlyInvoice)
router.post("/invoice/monthly/query",getMonthlyInvoice)
router.get("/invoice/aa/:id",getInvoicesOfAssesmentAgency)
router.put("/invoice/upload/:id",updateAssesmentAgencyPdf)
router.put("/invoice/payment/:id",updatePaymentStatusOfInvoice)





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
router.put("/aa/bdt/:id",updateBankDetails)








// ** exam ** will be created by ADMIN
router.post("/exam/create", verifyIsAdmin, assignAnExam);
router.get("/exam/all", getALlExams);
router.get("/exam/aa/:id", getALLExamsBelongsToAnAssesmentAgency);
router.put("/exam/addassessor/:id",assignAssesorToExam)
router.put("/exam/status/:id",changeExamCompleteStatus)
router.put("/exam/images/:id",uploadPhotos)
router.get("/exam/:id",fetchAExamDetails)
router.get("/exam/attendance/:id",getAttendanceSheetForExam)
router.put("/exam/assesmentdate/:id",addAssesmentDate)
router.put("/exam/paymentstatus/:id",updateExamPaymentStatus)
router.put("/exam/attendance/:id",updateStudentAttendanceNumber)





// ** upload marks
router.post("/marks/upload", createMark);
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
router.get("/scheme/query",fetchAllSchemeOfSchemeType)


// ** Price

router.post("/price",createPrice)

// ** queue

router.post("/qt",sendMessages)

// ** publish result 

router.post("/publish/certificate/exam/:id",publishResult)

// ** certificate 


router.post("/certificate/batch/:id",getAllStudentCertificate)


// ** sna routes 

router.post("/sna",createSNA)
router.post("/sna/login",snaLogin)
router.get("/sna/batch/query",getAllGovernmentBatchesStateAndScehmeWise)
router.put("/sna/batch/approve/:id",approveGovernmentSchemeBatches)
router.get("/sna/centers/query",filterCenterBySchemeAndState)
router.put("/sna/center/approve/:id",approveCenter)
router.get("/tp/centers/query",getAllApprovedCentersByScheme)
router.get("/tp/batches/all/query",getAllBatchesBySchemeName)


export default router;
