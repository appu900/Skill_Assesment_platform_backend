import CrudRepository from "./crud.repository.js";
import Notification from "../models/Notification.model.js";

class NotificationRepository extends CrudRepository {
  constructor() {
    super(Notification);
  }
}

export default NotificationRepository;
