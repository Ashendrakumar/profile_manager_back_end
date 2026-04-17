import CryptoJS from "crypto-js";
import config from "../config/config.js";
const { encryptionKey: SECRET_KEY } = config;

function encodeId(id) {
  return id;
  // return CryptoJS.AES.encrypt(id, SECRET_KEY).toString();
}

function decodeId(encoded) {
  return encoded;
  // const bytes = CryptoJS.AES.decrypt(encoded, SECRET_KEY);
  // return bytes.toString(CryptoJS.enc.Utf8);
}

export { encodeId, decodeId };
