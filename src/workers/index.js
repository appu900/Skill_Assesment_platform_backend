import startCertificateWorker from "./certificate.worker.js";
import startEmailWorker from "./email.worker.js";

const startWorkers = () => {
  const workers = [startCertificateWorker(), startEmailWorker()];
  return async () => {
    await Promise.all(workers.map((worker) => worker.close()));
  };
};

export default startWorkers;
