import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import serverConfig from "../../../config/serverConfig.js";

const SECRET_FIELDS = ["password", "passwordResetTokenHash", "passwordResetExpires", "tokenVersion"];

// ** login fields + methods shared by every ToA account type (training partner, assessor)
export default function toaAccount(schema, { role, tokenName }) {
  schema.add({
    password: { type: String, default: null },
    mustChangePassword: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
    // ** bumped on password change / suspension so older tokens stop working at once
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  });

  schema.pre("save", function hashPassword(next) {
    if (this.isModified("password") && this.password) {
      this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10));
    }
    next();
  });

  schema.methods.checkPassword = function check(plain) {
    return Boolean(this.password) && bcrypt.compareSync(String(plain), this.password);
  };

  schema.methods.isLocked = function isLocked() {
    return Boolean(this.lockUntil && this.lockUntil > new Date());
  };

  schema.methods.generateJwt = function generate() {
    return jwt.sign({ id: this._id, role, name: this[tokenName], tv: this.tokenVersion }, serverConfig.JWT_SECRET, {
      expiresIn: serverConfig.JWT_EXPIRES_IN,
    });
  };

  const transform = schema.get("toJSON")?.transform;
  schema.set("toJSON", {
    transform: (doc, ret, options) => {
      for (const field of SECRET_FIELDS) delete ret[field];
      ret.hasPassword = Boolean(doc.password);
      return transform ? transform(doc, ret, options) : ret;
    },
  });
}
