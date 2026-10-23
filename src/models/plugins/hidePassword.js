// ** never send password hashes to clients, applies to every res.json() of these documents
const hidePassword = (schema) => {
  schema.set("toJSON", {
    transform: (doc, ret) => {
      delete ret.password;
      return ret;
    },
  });
};

export default hidePassword;
