import StudentRepository from "../repository/student-repository.js";

class StudentService {
  constructor() {
    this.studentRepository = new StudentRepository();
  }

  async createStudent(data) {
    try {
      const student = await this.studentRepository.create(data);
      return student;
    } catch (error) {
      throw error;
    }
  }

  async getStudentByid(id){
    try {
        const student = await this.studentRepository.get(id);
        return student;
    } catch (error) {
        throw error;
    }
  }

  
}

export default StudentService;
