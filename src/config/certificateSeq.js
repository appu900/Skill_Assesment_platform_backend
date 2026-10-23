import CertificateCouter from "../models/CertficateSequence.js";

// ** the certificate model increments the "s1" counter, so initialize that one
async function intializeCertificateSequnce() {
  const counter = await CertificateCouter.findById("s1");
  if (!counter) {
    await CertificateCouter.create({ _id: "s1", counter: 0 });
  }
}

export default intializeCertificateSequnce;
