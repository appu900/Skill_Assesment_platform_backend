import TrainingPartnerService from "../service/TrainingPartner-service.js";
const trainingPartnerService = new TrainingPartnerService();

class TrainingPartnerController {
  static async createNewTrainingPartner(req, res) {
    try {
      const result = await trainingPartnerService.createTrainingPartner(req.body);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: {},
        error: error.message,
      });
    }
  }

  static async login(req, res) {
    try {
      const response = await trainingPartnerService.login(req.body);
      return res.status(200).json({
        succes: true,
        data: response.token,
      });
    } catch (error) {
      return res.status(500).json({
        succes: false,
        data: {},
        error: error.message,
      });
    }
  }
}

export default TrainingPartnerController;
