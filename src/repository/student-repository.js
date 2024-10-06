import CrudRepository from "./crud.repository.js";
import Student from "../models/Student.model.js";

class StudentRepository extends CrudRepository {
  constructor() {
    super(Student);
  }

  async getStudentDetails(studentId) {
    try {
      const student = await Student.findById(studentId).populate("marks");
      return student;
    } catch (error) {
      throw error;
    }
  }

  async updateProfilePic(id, imageUrl) {
    try {
      const response = await Student.findByIdAndUpdate(
        id,
        {
          profilepic: imageUrl,
        },
        { new: true }
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getStudentWithMprId(mprId) {
    try {
      const student = await Student.findOne({ MPR_Id: mprId });
      return student;
      return student;
    } catch (error) {
      throw error;
    }
  }

  async addDateOfIssueMarksheet(studentId) {
    try {
      const today = new Date();
      const response = await Student.findByIdAndUpdate(
        studentId,
        {
          DateOfIssueMarksheet:today,
        },
        { new: true }
      );
      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default StudentRepository;
