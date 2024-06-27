import TrainingPartnerService from "../service/TrainingPartner-service.js";
import { StatusCodes } from "http-status-codes";
const tpService = new TrainingPartnerService();
class TrainingPartnerController {
  //** onBoard TraingPartner application */

  static async onBoardTrainingPartner(req, res) {
    try {
      const response = await tpService.createTrainingPartner(req.body);
      return res.status(201).json({
        success: true,
        message: "trainingPartner application created",
        data: response,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "internal Server error",
      });
    }
  }

  //   ** get traingpartnerById ** //
  static async getTrainingPartnerById(req, res) {
    try {
      const trainingPartner = await tpService.getTrainingPartnerById(
        req.params.id
      );
      return res.status(200).json({
        success: true,
        message: "data fetched sucessfully",
        data: trainingPartner,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "internal Server error",
      });
    }
  }

  //   ** get all data from database about traingPartner

  static async getAllData(req, res) {
    try {
      const response = await tpService.getAllTrainingParterData();
      console.log(response);
      return res.status(200).json({
        success: true,
        data: response,
        message: "data fetched successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "internal Server error",
      });
    }
  }

  static async updateTrainingPartnerStatus(req, res) {
    try {
      const response = await tpService.updateTrainingPartnerDetails(
        req.params.id,
        req.body
      );
      return res.status(200).json({
        data: response,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "something went wrong in updating status",
      });
    }
  }

  static async updateStatusToApproved(req, res) {
    try {
      const response = await tpService.ApproveApplication(req.params.id);
      return res.status(200).json({
        success: true,
        data: response,
        message: "Application approved sucessfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "something went wrong in updating status",
      });
    }
  }

  static async updateStatusToRejected(req, res) {
    try {
      const response = await tpService.rejectApplication(req.params.id);
      return res.status(200).json({
        success: true,
        data: response,
        message: "Application rejected sucessfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "something went wrong in updating status",
      });
    }
  }

  // ** login controller
  static async login(req, res) {
    try {
      const response = await tpService.login(
        req.body.registeredOfficeEmail,
        req.body.password
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "login sucessfull",
        data: response,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "something went wrong in login process",
      });
    }
  }

  static async getNewTrainingPartnerApplications(req, res) {
    try {
      const response = await tpService.getNewOnbordedTrainingPartner();
      return res.status(StatusCodes.OK).json({
        success: true,
        data: response,
        message: "data fetched sucessfully",
      });
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "something went wrong in fetching data",
      });
    }
  }


  static async getApprovedTrainingPartnerData(req, res) {
    try {
      const response = await tpService.getAllApprovedTrainingPartner();
      return res.status(StatusCodes.OK).json({
        success: true,
        data: response,
        message: "data fetched sucessfully",
      });
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        success: false,
        error: error.message,
        message: "something went wrong in fetching data",
      });
    }
  }
}

export default TrainingPartnerController;





