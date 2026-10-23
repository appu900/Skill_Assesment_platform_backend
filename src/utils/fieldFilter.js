// ** remove fields a client must never be able to set directly (status flags, payments, etc.)
const omit = (data = {}, fields = []) => {
  const copy = { ...data };
  fields.forEach((field) => delete copy[field]);
  return copy;
};

export { omit };
