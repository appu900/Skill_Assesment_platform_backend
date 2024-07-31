import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SNASchema = new mongoose.Schema(
  {
    scheme: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  {
    timeseries: true,
  }
);

// ** hashing password before saving this

SNASchema.pre("save", async function (next) {
  const sna = this;
  const salt = bcrypt.genSaltSync(10);
  const encryptedPassword = bcrypt.hashSync(sna.password, salt);
  sna.password = encryptedPassword;
  next();
});

// ** password comparasion for login
SNASchema.methods.checkPassword = function check(userInputPlainPassword) {
  return bcrypt.compareSync(userInputPlainPassword, this.password);
};

// ** generate jwt token for middleware verification

SNASchema.methods.generateJwt = function generate() {
  return jwt.sign(
    {
      id: this._id,
      scheme:this.scheme,
    },
    "this is a secrete a key",
    { expiresIn: "30d" }
  );
};

const SNA = new mongoose.model("SNA", SNASchema);

export default SNA;
