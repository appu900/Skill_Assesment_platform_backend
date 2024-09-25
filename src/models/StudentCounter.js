import mongoose from "mongoose";



const studentCounterSchema = new mongoose.Schema({
    _id:{
        type:String,
      },
      counter: {
        type: Number,
      },
})


const StudentCounter = mongoose.model("StudentCounter", studentCounterSchema);

export default StudentCounter;