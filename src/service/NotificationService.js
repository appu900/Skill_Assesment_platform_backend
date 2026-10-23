import NotificationRepository from "../repository/Notification-Repository.js";

class NotificationService {
  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async createNotification(data) {
    return this.notificationRepository.create(data);
  }

  async getAllNotifications() {
    return this.notificationRepository.getAll();
  }
}

export default NotificationService;
