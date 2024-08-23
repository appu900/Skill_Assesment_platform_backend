import NotificationRepository from "../repository/Notification-Repository.js";

class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createNotification(data) {
    try {
      const response = await this.notificationRepository.create(data);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export default NotificationService;
