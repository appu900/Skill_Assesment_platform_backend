import CrudRepository from "./crud.repository.js";
import Student from "../models/Student.model.js";

class StudentRepository extends CrudRepository {
  constructor() {
    super(Student);
  }

  async getStudentDetails(studentId) {
    return Student.findById(studentId).populate("marks");
  }

  async getStudentsByIds(studentIds) {
    return Student.find({ _id: { $in: studentIds } });
  }

  async updateProfilePic(id, imageUrl) {
    return Student.findByIdAndUpdate(id, { profilepic: imageUrl }, { new: true });
  }

  async getStudentWithMprId(mprId) {
    return Student.findOne({ MPR_Id: String(mprId) });
  }

  async addDateOfIssueMarksheet(studentId) {
    return Student.findByIdAndUpdate(studentId, { DateOfIssueMarksheet: new Date() }, { new: true });
  }
}

export default StudentRepository;
