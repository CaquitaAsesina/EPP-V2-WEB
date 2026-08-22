const ExcelJS = require('exceljs');

class ExportService {
  static async toExcel(data, columns, sheetName = 'Datos') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = columns;

    // Style header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };
    sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 25;

    data.forEach(row => {
      const rowData = {};
      columns.forEach(col => {
        rowData[col.header] = row[col.key] !== undefined ? row[col.key] : '';
      });
      sheet.addRow(rowData);
    });

    // Auto-width
    sheet.columns.forEach(col => {
      let maxLen = col.header.length;
      col.eachCell(cell => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    // Borders
    sheet.eachRow(row => {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    return workbook;
  }

  static getContentType() {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  static getFilename(module) {
    const date = new Date().toISOString().slice(0, 10);
    return `${module}_${date}.xlsx`;
  }
}

module.exports = ExportService;
