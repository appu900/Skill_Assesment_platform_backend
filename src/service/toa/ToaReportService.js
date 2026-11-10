import mongoose from "mongoose";
import ToaTrainee from "../../models/toa/ToaTrainee.model.js";
import ToaBatch from "../../models/toa/ToaBatch.model.js";
import ToaInvoice from "../../models/toa/ToaInvoice.model.js";
import ToaPayment from "../../models/toa/ToaPayment.model.js";
import ToaResult from "../../models/toa/ToaResult.model.js";
import ToaCertificate from "../../models/toa/ToaCertificate.model.js";
import ToaAttendanceService from "./ToaAttendanceService.js";
import { day, inr } from "./ToaInvoiceService.js";
import { fillTemplate, htmlToPdf } from "../../utils/toa/render.js";
import { workbookBuffer } from "../../utils/toa/excel.js";

const sum = (rows, key = "total") => rows.reduce((total, row) => total + (row[key] ?? 0), 0);
const countBy = (rows, key) => rows.reduce((acc, row) => ({ ...acc, [row[key]]: (acc[row[key]] ?? 0) + 1 }), {});
const oid = (value) => (mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(String(value)) : null);

const REPORT_COLUMNS = [
  { header: "Training partner", key: "trainingPartner", width: 28 },
  { header: "Batch", key: "batchCode", width: 18 },
  { header: "Programme", key: "programmeName", width: 28 },
  { header: "Start", key: "startDate", width: 13 },
  { header: "End", key: "endDate", width: 13 },
  { header: "Batch status", key: "batchStatus", width: 13 },
  { header: "Registration ID", key: "registrationId", width: 20 },
  { header: "Assessor", key: "name", width: 24 },
  { header: "Attendance %", key: "attendance", width: 12 },
  { header: "Invoice", key: "invoiceNumber", width: 24 },
  { header: "Payment", key: "paymentStatus", width: 11 },
  { header: "Score", key: "score", width: 8 },
  { header: "Result", key: "result", width: 9 },
  { header: "Certificate", key: "certificateNumber", width: 26 },
  { header: "Certificate status", key: "certificateStatus", width: 14 },
];

const REPORT_HTML = `<!doctype html><html><head><meta charset="utf-8" /><style>
body{font-family:Arial,sans-serif;font-size:8pt;margin:0}h1{font-size:13pt;margin:0 0 4px}p{margin:0 0 10px;color:#555}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:3px 4px;text-align:left}th{background:#f0f0f0}
</style></head><body><h1>RailTel ToA report</h1><p>{{filters}} · generated {{generatedAt}} · {{count}} rows</p>
<table><thead><tr><th>Partner</th><th>Batch</th><th>Programme</th><th>Dates</th><th>Reg. ID</th><th>Assessor</th><th>Att. %</th><th>Invoice</th><th>Payment</th><th>Score</th><th>Result</th><th>Certificate</th><th>Cert. status</th></tr></thead>
<tbody>{{#rows}}<tr><td>{{trainingPartner}}</td><td>{{batchCode}}</td><td>{{programmeName}}</td><td>{{startDate}} – {{endDate}}</td><td>{{registrationId}}</td><td>{{name}}</td><td>{{attendance}}</td><td>{{invoiceNumber}}</td><td>{{paymentStatus}}</td><td>{{score}}</td><td>{{result}}</td><td>{{certificateNumber}}</td><td>{{certificateStatus}}</td></tr>{{/rows}}</tbody></table></body></html>`;

class ToaReportService {
  constructor() {
    this.attendance = new ToaAttendanceService();
  }

  // ** KPIs of the FRD (registrations, batches, money, certification); scoped to one partner when tpId is given
  async dashboard(tpId = null) {
    const scope = tpId ? { toaTpId: oid(tpId) } : {};
    const [trainees, batches, invoices, refunds, certificates, monthly] = await Promise.all([
      ToaTrainee.find(scope).select("status").lean(),
      ToaBatch.find(scope).select("status resultsStatus").lean(),
      ToaInvoice.find({ ...scope, status: { $ne: "cancelled" } }).select("status total").lean(),
      ToaPayment.find({ ...scope, status: "refunded" }).select("amount").lean(),
      ToaCertificate.countDocuments({ ...scope, status: "valid" }),
      ToaCertificate.aggregate([
        { $match: { ...scope, status: { $in: ["valid", "reissued"] }, issueDate: { $gte: new Date(Date.now() - 365 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$issueDate", timezone: "Asia/Kolkata" } }, certificates: { $sum: 1 } } },
        { $project: { _id: 0, month: "$_id", certificates: 1 } },
        { $sort: { month: 1 } },
      ]),
    ]);
    const traineeCount = countBy(trainees, "status");
    const batchCount = countBy(batches, "status");
    return {
      registrations: {
        total: trainees.length,
        draft: traineeCount.draft ?? 0,
        pending: (traineeCount.submitted ?? 0) + (traineeCount.under_review ?? 0),
        correction: traineeCount.correction_required ?? 0,
        approved: traineeCount.approved ?? 0,
        rejected: traineeCount.rejected ?? 0,
      },
      batches: {
        total: batches.length,
        draft: (batchCount.draft ?? 0) + (batchCount.returned ?? 0),
        submitted: (batchCount.submitted ?? 0) + (batchCount.under_review ?? 0),
        approved: batchCount.approved ?? 0,
        completed: batchCount.completed ?? 0,
        rejected: batchCount.rejected ?? 0,
      },
      finance: {
        invoiced: sum(invoices),
        collected: sum(invoices.filter((invoice) => invoice.status === "paid")),
        pending: sum(invoices.filter((invoice) => invoice.status === "unpaid")),
        refunded: sum(refunds, "amount"),
        unpaidInvoices: invoices.filter((invoice) => invoice.status === "unpaid").length,
      },
      certification: {
        resultsPending: batches.filter((batch) => batch.status === "approved" && batch.resultsStatus !== "published").length,
        certificatesIssued: certificates,
      },
      monthly,
    };
  }

  // ** one row per assessor per batch, with every filter of the FRD
  async rows(query = {}) {
    const batchFilter = {};
    if (oid(query.toaTpId)) batchFilter.toaTpId = oid(query.toaTpId);
    if (oid(query.batchId)) batchFilter._id = oid(query.batchId);
    if (query.programme) batchFilter.programmeName = new RegExp(String(query.programme).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (query.from || query.to) {
      batchFilter.startDate = {};
      if (query.from) batchFilter.startDate.$gte = new Date(query.from);
      if (query.to) batchFilter.startDate.$lte = new Date(query.to);
    }
    const batches = await ToaBatch.find(batchFilter).sort({ startDate: -1 }).limit(500).populate("toaTpId", "organizationName").populate("trainees.trainee", "name registrationId");
    const batchIds = batches.map((batch) => batch._id);
    const [invoices, results, certificates] = await Promise.all([
      ToaInvoice.find({ batch: { $in: batchIds } }).lean(),
      ToaResult.find({ batch: { $in: batchIds } }).lean(),
      ToaCertificate.find({ batch: { $in: batchIds }, status: { $ne: "reissued" } }).lean(),
    ]);
    const invoiceOf = new Map(invoices.map((invoice) => [String(invoice.batch), invoice]));
    const resultOf = new Map(results.map((row) => [`${row.batch}:${row.trainee}`, row]));
    const certificateOf = new Map(certificates.map((row) => [`${row.batch}:${row.trainee}`, row]));
    const rows = [];
    for (const batch of batches) {
      const invoice = invoiceOf.get(String(batch._id));
      const { approvedSessions, percentOf } = await this.attendance.percentages(batch);
      for (const { trainee } of batch.trainees) {
        if (!trainee) continue;
        const result = resultOf.get(`${batch._id}:${trainee._id}`);
        const certificate = certificateOf.get(`${batch._id}:${trainee._id}`);
        rows.push({
          trainingPartner: batch.toaTpId?.organizationName,
          batchCode: batch.batchCode,
          programmeName: batch.programmeName,
          startDate: day(batch.startDate),
          endDate: day(batch.endDate),
          batchStatus: batch.status,
          registrationId: trainee.registrationId,
          name: trainee.name,
          attendance: approvedSessions ? Math.round(percentOf(trainee._id) * 10) / 10 : "",
          invoiceNumber: invoice?.invoiceNumber ?? "",
          paymentStatus: invoice?.status ?? "not invoiced",
          score: result && ["published", "withheld"].includes(result.status) ? result.score : result ? `${result.score} (draft)` : "",
          result: result?.result ?? "",
          certificateNumber: certificate?.certificateNumber ?? "",
          certificateStatus: certificate?.status ?? (result?.status === "withheld" ? "withheld" : "not issued"),
        });
      }
    }
    return rows.filter(
      (row) =>
        (!query.paymentStatus || row.paymentStatus === query.paymentStatus) &&
        (!query.result || row.result === query.result) &&
        (!query.certificateStatus || row.certificateStatus === query.certificateStatus)
    );
  }

  async xlsx(query) {
    return workbookBuffer("ToA report", REPORT_COLUMNS, await this.rows(query), { title: "RailTel Training of Assessors – report" });
  }

  async pdf(query) {
    const rows = await this.rows(query);
    const filters = Object.entries(query).filter(([key, value]) => value && key !== "format").map(([key, value]) => `${key}: ${value}`).join(", ") || "all records";
    return htmlToPdf(fillTemplate(REPORT_HTML, { rows, count: rows.length, filters, generatedAt: day(new Date()) }), { landscape: true });
  }

  // ** money view: totals and per-invoice lines for reconciliation
  async financeXlsx(query = {}) {
    const filter = {};
    if (oid(query.toaTpId)) filter.toaTpId = oid(query.toaTpId);
    if (query.status) filter.status = String(query.status);
    const invoices = await ToaInvoice.find(filter).sort({ invoiceDate: -1 }).populate("payment", "paymentId receiptNumber verifiedAt method gateway").lean();
    return workbookBuffer(
      "Invoices",
      [
        { header: "Invoice", key: "invoiceNumber", width: 26 },
        { header: "Date", key: "invoiceDate", width: 13 },
        { header: "Training partner", key: "payer", width: 28 },
        { header: "Subtotal", key: "subtotal", width: 12 },
        { header: "GST", key: "gstAmount", width: 10 },
        { header: "Total", key: "total", width: 12 },
        { header: "Status", key: "status", width: 11 },
        { header: "Due", key: "dueDate", width: 13 },
        { header: "Paid on", key: "paidAt", width: 13 },
        { header: "Transaction", key: "paymentId", width: 26 },
        { header: "Receipt", key: "receiptNumber", width: 26 },
      ],
      invoices.map((invoice) => ({
        ...invoice,
        invoiceDate: day(invoice.invoiceDate),
        dueDate: day(invoice.dueDate),
        paidAt: day(invoice.paidAt),
        payer: invoice.payer?.organizationName,
        paymentId: invoice.payment?.paymentId ?? "",
        receiptNumber: invoice.payment?.receiptNumber ?? "",
      })),
      { title: `RailTel ToA invoices · ₹${inr(sum(invoices))} invoiced` }
    );
  }
}

export default ToaReportService;
