import crypto from "crypto";

// ** readable temporary password for accounts the admin creates (no 0/O, 1/l/I look-alikes)
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generatePassword = (length = 10) =>
  Array.from(crypto.randomBytes(length), (byte) => ALPHABET[byte % ALPHABET.length]).join("");

export default generatePassword;
