import TrainingPartnerService from "../service/TrainingPartner-service.js";
import { CREATED, INTERNAL_SERVER_ERROR, SUCESS } from "../utils/statusCode.js";

const trainingPartnerService = new TrainingPartnerService();

class TrainingPartnerController {
  static async createNewTrainingPartner(req, res) {
    try {
      const response = await trainingPartnerService.createTrainingPartner(
        req.body
      );
      return res.status(CREATED).json({
        sucess: true,
        data: response,
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async updateTrainingPartner(req, res) {
    try {
      const response = await trainingPartnerService.updateTrainingPartner(
        req.params.id,
        req.body
      );

      return res.status(SUCESS).json({
        sucess: true,
        data: response,
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async deleteTrainingPartner(req, res) {
    try {
      await trainingPartnerService.deleteTrainingPartner(req.params.id);
      return res.status(SUCESS).json({
        sucess: true,
        data: {},
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async getTrainingPartner(req, res) {
    console.log();
    try {
      const response = await trainingPartnerService.getTrainingPartnerById(
        req.params.id
      );
      return res.status(SUCESS).json({
        sucess: true,
        data: response,
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async getAllTrainingPartners(req, res) {
    try {
      const response = await trainingPartnerService.getAllTrainingPartner();
      return res.status(SUCESS).json({
        sucess: true,
        data: response,
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async deleteTrainingPartners(req, res) {
    try {
      await trainingPartnerService.deleteTrainingPartner(req.id);

      return res.status(SUCESS).json({
        sucess: true,
        data: {},
      });
    } catch (error) {
      return res.status(INTERNAL_SERVER_ERROR).json({
        sucess: false,
        data: {},
        error: error.message,
      });
    }
  }
}

export default TrainingPartnerController;
