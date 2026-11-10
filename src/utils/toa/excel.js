import ExcelJS from "exceljs";

// ** one-sheet workbook from column definitions [{ header, key, width }] and plain row objects
export async function workbookBuffer(sheetName, columns, rows, { title } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CUTM Awarding Body";
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));
  if (title) {
    sheet.addRow([title]).font = { bold: true, size: 13 };
    sheet.addRow([]);
  }
  const header = sheet.addRow(columns.map((column) => column.header));
  header.font = { bold: true };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
  });
  for (const row of rows) sheet.addRow(columns.map((column) => row[column.key] ?? ""));
  columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width ?? 18;
  });
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ** rows of the first sheet as objects keyed by the header row, found by one of its column names
export async function readSheet(buffer, headerName = "Registration ID") {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  let headerRow = null;
  const rows = [];
  sheet.eachRow((row) => {
    // ** formula results, hyperlinks and rich text come back as objects
    const values = row.values.slice(1).map((value) => {
      if (!value || typeof value !== "object" || value instanceof Date) return value;
      if ("result" in value) return value.result;
      if ("text" in value) return value.text;
      if (Array.isArray(value.richText)) return value.richText.map((part) => part.text).join("");
      return value;
    });
    if (!headerRow) {
      if (values.some((value) => String(value ?? "").trim().toLowerCase() === headerName.toLowerCase())) headerRow = values.map((value) => String(value ?? "").trim());
      return;
    }
    rows.push(Object.fromEntries(headerRow.map((key, index) => [key, values[index]])));
  });
  return rows;
}

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function sendFile(res, buffer, filename, type) {
  res.setHeader("Content-Type", type);
  res.setHeader("Content-Disposition", `attachment; filename="${filename.replace(/[^\w.-]/g, "_")}"`);
  res.setHeader("Cache-Control", "no-store");
  res.send(buffer);
}
