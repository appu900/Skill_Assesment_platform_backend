import CertificateCouter from "../models/CertficateSequence.js";

async function intializeCertificateSequnce() {
  const counter = await CertificateCouter.findById("C1");
  if (!counter) {
    await CertificateCouter.create({ _id: "C1", counter: 0 });
  }
}


export default intializeCertificateSequnce;

