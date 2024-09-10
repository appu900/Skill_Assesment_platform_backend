import BatchRepository from "../repository/Batch-repository.js";
import StudentService from "./student-service.js";
import StudentRepository from "../repository/student-repository.js";
import TrainerRepository from "../repository/Trainer-Repository.js";
import TrainingPartnerRepository from "../repository/TrainingPartner-Repository.js";
import PriceService from "./Price-service.js";
import InvoiceService from "./InvoiceService.js";
import SchemeRepository from "../repository/SchemeRepository.js";
import mongoose from "mongoose";

class BatchService {
  constructor() {
    this.batchRepository = new BatchRepository();
    this.studentRepository = new StudentRepository();
    this.trainerRepository = new TrainerRepository();
    this.trainingPartnerRepository = new TrainingPartnerRepository();
    this.priceService = new PriceService();
    this.invoiceService = new InvoiceService();
    this.schemeRepository = new SchemeRepository();
  }


  

  // ** A function to check before submittion of batch data every student in a batch has profile pic or not if not then return false

  async checkImageForStudents(batchId){
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found");
      }
      let studentsWithOutImage = [];
      const students = batch.students;
      let flag = true;
      for (let i = 0; i < students.length; i++) {
        const student = await this.studentRepository.get(students[i]);
        if (!student.profilepic) {  
          flag = false;
          studentsWithOutImage.push(student.name);
        }
      }
      return { flag,studentsWithOutImage };
    } catch (error) {
      throw error;
    }
  }

  async createBatch(data) {
    try {
      const trainingPartnerId = data.trainingOrganizationId;
      const trainingPartner = await this.trainingPartnerRepository.get(
        trainingPartnerId
      );

      if (!trainingPartner) {
        throw new Error("training partner not found");
      }

      if (trainingPartner.applicationStatus !== "Approved") {
        throw new Error("training partner is not approved");
      }

      data.trainingOrganization = trainingPartner.organizationName;
      data.trainingOrganizationId = trainingPartner._id;

      const batch = await this.batchRepository.create(data);
      return batch;
    } catch (error) {
      throw error;
    }
  }

  async addStudent(batchId, data) {
    try {
      const batch = await this.batchRepository.get(batchId);
      console.log(batch);
      if (!batch) {
        throw new Error("batch not found");
      }
      data.enrolledBatch = batch._id;
      const student = await this.studentRepository.create(data);
      batch.students.push(student);
      await batch.save();
      console.log("this is batch", batch);
      return student;
    } catch (error) {
      throw error;
    }
  }

  async addTrainerTobatch(batchId, data) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found");
      }
      const trainer = await this.trainerRepository.create(data);
      trainer.batches.push(batch);
      batch.trainers.push(trainer);
      await batch.save();
      await trainer.save();
      return trainer;
    } catch (error) {
      throw error;
    }
  }

  async getBatchData(batchId) {
    try {
      const res = await this.batchRepository.getBatchDetails(batchId);
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getBatchesOfTrainingPartner(id) {
    try {
      const res =
        await this.batchRepository.getAllbatchesForAnIndividualTrainingPartner(
          id
        );
      return res;
    } catch (error) {
      throw error;
    }
  }

  async getAllBatces() {
    try {
      const response = await this.batchRepository.getAllBatches();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterQueryData(query) {
    try {
      const { state, sector, course, trainingOrganization } = query;
      const queryObject = {};
      if (state) {
        queryObject.state = state;
      }
      if (sector) {
        queryObject.sectorName = sector;
      }
      if (course) {
        queryObject.courseName = course;
      }
      if (trainingOrganization) {
        queryObject.trainingOrganization = trainingOrganization;
      }
      const response = await this.batchRepository.filterData(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** this will update the teachers in the batch ( data will contains only existing teacher ids coming from frontend)

  async bulkTeacherInsert(batchId, data) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found with this id");
      }

      if (!Array.isArray(data)) {
        throw new Error("data should be in array format!");
      }
      const trainerIdObjects = data.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      batch.trainers.push(...trainerIdObjects);
      const response = await batch.save();
      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // ** this will update the batch payment status(client payment status) with invoice(pre & post)
  async updateClientPayment(batchId, preInvoiceUrl, postInvoiceUrl) {
    try {
      const response = await this.batchRepository.updateClientPaymentStatus(
        batchId,
        preInvoiceUrl,
        postInvoiceUrl
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** this will update the batch payment status(admin payment status)
  async updatefinalPaymentStatus(batchId) {
    try {
      const response = await this.batchRepository.updatePayamentStatus(batchId);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** active batch permission from client end

  async activeBatch(batchId) {
    try {
      const batch = await this.batchRepository.get(batchId);

      if (!batch) {
        throw new Error("batch not found");
      }

      if(batch.batchActivePermission === true){
        throw new Error("batch is already Submitted");
      }

      if (batch.students.length === 0) {
        throw new Error("complete the batch with students first");
      }

      // ** check for image ..of students before activating the batch

      const {flag,studentsWithOutImage} = await this.checkImageForStudents(batchId);
      if(flag === false){
        throw new Error(`students ${studentsWithOutImage} has no profile pic`);
      }

      const tp = await this.trainingPartnerRepository.get(
        batch.trainingOrganizationId
      );

      // ** calculate payment amount if schemeType is Corporate
      let totalAmount = 0;
      let perStudentCost = 0;

      if (batch.schemeType === "Corporate") {
        totalAmount =
          tp.organizationCorporatePaymentFee * batch.students.length;
        batch.amountToPaid = totalAmount;
        perStudentCost = tp.organizationCorporatePaymentFee;
      } else {
        //  ** fetch scheme code and calculate payment amount based on scheme code
        const scheme = await this.schemeRepository.findBySchemeName(
          batch.scheme
        );
        totalAmount = scheme.pricePerStudent * batch.students.length;
        perStudentCost = scheme.pricePerStudent;
      }

      const invoiceData = {
        payer: "TrainingPartner",
        payee: "Admin",
        purpose: "batch payment",
        amount: totalAmount,
        paymentStatus: false,
        TrainingPartnerId: batch.trainingOrganizationId,
        BatchId: batch._id,
      };

      this.invoiceService.createInvoice(invoiceData).catch((error) => {
        console.log("error in invoice generation", error);
      });

      const response = await this.batchRepository.activateBatchByClient(
        batchId,
        totalAmount,
        perStudentCost
      );

      return true;
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  }

  // ** manual payment amount add from admin

  async addPaymentCorporatePayment(batchId, amount) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (batch.corporatePaymentType === false) {
        throw new Error("this batch is not corporate type");
      }

      if (batch.batchActivePermission === false) {
        throw new Error("this batch is not ready to accept payment");
      }

      batch.amountToPaid = amount;
      const response = await batch.save();
      const invoiceData = {
        payer: "TrainingPartner",
        payee: "Admin",
        purpose: "batch payment",
        payAbleamount: amount,
        paidAmount: 0,
        paymentStatus: false,
        TrainingPartnerId: batch.trainingOrganizationId,
        BatchId: batch._id,
      };

      this.invoiceService.createInvoice(invoiceData).catch((error) => {
        console.log("error in invoice generation", error);
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** tp will update the payment clientsidepayement status with pre and post invoice
  async updateClientPaymentDetails(
    batchId,
    preinVoiceUrl,
    postInvoiceUrl,
    transactionId
  ) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found");
      }
      batch.clientPaymentStatus = true;
      batch.prePaymentInvoice = preinVoiceUrl;
      batch.postPaymentInvoice = postInvoiceUrl;
      batch.transactionId = transactionId;
      const response = await batch.save();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getAllPaymentNotifications() {
    try {
      const response = await this.batchRepository.getBatchesByPendingPayment();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getBatchByCorporatePayment() {
    try {
      const response =
        await this.batchRepository.getAllBatchByCorporatePayment();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async updateFinalPaymentStatus(batchId) {
    try {
      const response = await this.batchRepository.updatePayamentStatus(batchId);
      const invoice = await this.invoiceService.getInvoiceByBatchId(batchId);
      invoice.paymentStatus = true;
      invoice.paymentDate = new Date();
      await invoice.save();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // ** this will fetch the all batches for payment approval after approved by SNAs

  async getAllGovernmentBatchesForPaymentApproval() {
    try {
      const response =
        await this.batchRepository.getAllGovernmentBatchesPendingPaymentData();
      return response;
    } catch (error) {
      throw error;
    }
  }

  async filterStateWiseAndScehemWiseData(query) {
    try {
      let queryObject = {};
      const { state, scheme } = query;
      if (state) {
        queryObject.state = state;
      }
      if (scheme) {
        queryObject.scheme = scheme;
      }
      queryObject.batchActivePermission = true;
      queryObject.approvedByGovernmentBody = false;
      console.log(queryObject);
      const response = await this.batchRepository.filterData(queryObject);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ** this will approve the batch by SNA

  async approveGovernmentBatch(batchId) {
    try {
      const batch = await this.batchRepository.get(batchId);
      if (!batch) {
        throw new Error("batch not found");
      }
      batch.approvedByGovernmentBody = true;
      const response = await batch.save();
      const resonseobj = {
        batchId: response._id,
        sucess: true,
      };
      return resonseobj;
    } catch (error) {
      throw error;
    }
  }

  async getAllBatchesBySchemeName(schemeName,state) {
    try {
      console.log(state)
      const response = await this.batchRepository.getBatchesBySchemeName(
        schemeName,
        state
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default BatchService;
