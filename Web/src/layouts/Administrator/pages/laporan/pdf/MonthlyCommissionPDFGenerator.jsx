import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

// Function to generate and preview PDF for monthly commission report
export const generateMonthlyCommissionPDF = (
  commissionData,
  selectedMonth,
  selectedYear,
  toast
) => {
  return new Promise((resolve, reject) => {
    try {
      // Set up PDF document with A4 size (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Current date formatting
      const currentDate = new Date()
        .toLocaleString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour12: false,
        })
        .replace(":", ".");

      // Format currency for PDF
      const formatCurrency = (value) => {
        return `Rp${(value || 0).toLocaleString("id-ID")}`;
      };

      // Get month name from selectedMonth
      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
      const monthName = months[selectedMonth - 1] || "Unknown";

      // Prepare header content
      const headerLines = [
        "ReUse Mart",
        "Jl. Green Eco Park No. 456 Yogyakarta",
        "", // Empty line for spacing
        "LAPORAN KOMISI BULANAN",
        `Bulan: ${monthName}`,
        `Tahun: ${selectedYear}`,
        `Tanggal cetak: ${currentDate}`,
        "", // Additional empty line for spacing after print date
      ];

      // Prepare table data with header row
      const tableData = [
        // Header row (merged across all columns for custom header)
        [
          {
            content: "",
            colSpan: 10,
            styles: {
              fontSize: 10,
              halign: "left",
              valign: "top",
              minCellHeight: 34, // Increased to accommodate extra line
              cellPadding: 5,
            },
          },
        ],
        // Column headers
        [
          {
            content: "Kode Produk",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Nama Produk",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Harga Jual",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Tanggal Masuk",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Tanggal Laku",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Komisi Penitip",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Komisi Hunter",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Komisi ReuseMart",
            styles: { fontStyle: "bold", halign: "left" },
          },
          { content: "Bonus", styles: { fontStyle: "bold", halign: "left" } },
          {
            content: "Subtotal",
            styles: { fontStyle: "bold", halign: "left" },
          },
        ],
      ];

      // Add data rows
      commissionData.data.forEach((item) => {
        tableData.push([
          item.kode_produk || "-",
          item.nama_produk || "-",
          formatCurrency(item.harga_jual),
          item.tanggal_masuk || "-",
          item.tanggal_laku || "-",
          formatCurrency(item.komisi_penitip),
          formatCurrency(item.komisi_hunter),
          formatCurrency(item.komisi_reusemart),
          formatCurrency(item.bonus),
          formatCurrency(item.subtotal),
        ]);
      });

      // Add total row
      tableData.push([
        {
          content: "Total",
          colSpan: 5,
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: formatCurrency(commissionData.totals.komisi_penitip),
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: formatCurrency(commissionData.totals.komisi_hunter),
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: formatCurrency(commissionData.totals.komisi_reusemart),
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: formatCurrency(commissionData.totals.bonus),
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: formatCurrency(commissionData.totals.subtotal),
          styles: { fontStyle: "bold", halign: "left" },
        },
      ]);

      // Generate the main table
      autoTable(pdf, {
        startY: 25,
        body: tableData,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 2,
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
          overflow: "linebreak",
        },
        columnStyles: {
          0: { cellWidth: 24, halign: "left" },
          1: { cellWidth: 34, halign: "left" },
          2: { cellWidth: 24, halign: "left" },
          3: { cellWidth: 24, halign: "left" },
          4: { cellWidth: 24, halign: "left" },
          5: { cellWidth: 24, halign: "left" },
          6: { cellWidth: 24, halign: "left" },
          7: { cellWidth: 24, halign: "left" },
          8: { cellWidth: 24, halign: "left" },
          9: { cellWidth: 24, halign: "left" },
        },
        margin: { left: 20, right: 27 },
        tableLineWidth: 0.3,
        tableLineColor: [0, 0, 0],
        headStyles: {
          minCellHeight: 5,
          fontSize: 9,
          cellPadding: 2,
        },
        bodyStyles: {
          minCellHeight: 5,
        },
        didDrawCell: (data) => {
          // Handle header cell for custom styling
          if (
            data.section === "body" &&
            data.row.index === 0 &&
            data.column.index === 0
          ) {
            const cell = data.cell;
            const x = cell.x + 2;
            let y = cell.y + 5;

            pdf.setFontSize(10);
            headerLines.forEach((line, index) => {
              if (line === "ReUse Mart" || line === "LAPORAN KOMISI BULANAN") {
                pdf.setFont("helvetica", "bold");
              } else {
                pdf.setFont("helvetica", "normal");
              }
              if (line) {
                pdf.text(line, x, y);
                if (line === "LAPORAN KOMISI BULANAN") {
                  const textWidth = pdf.getTextWidth(line);
                  pdf.line(x, y + 1, x + textWidth, y + 1);
                  y += 2;
                }
              }
              y += 4;
            });
          }
        },
      });

      // Generate PDF blob and open in new window
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        resolve();
      } else {
        toast?.error("Popup diblokir. Harap izinkan popup untuk preview PDF.", {
          position: "top-right",
          autoClose: 3000,
        });
        reject(new Error("Popup blocked"));
      }

      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast?.error(`Gagal membuat PDF: ${err.message}`, {
        position: "top-right",
        autoClose: 3000,
      });
      reject(err);
    }
  });
};

// Create a standalone preview component for monthly commission report
export const MonthlyCommissionReportPreview = ({
  commissionData,
  selectedMonth,
  selectedYear,
}) => {
  return (
    <div>
      <button
        onClick={() =>
          generateMonthlyCommissionPDF(
            commissionData,
            selectedMonth,
            selectedYear
          )
        }
        className="bg-stone-500 text-white px-3 py-1 rounded-md hover:bg-stone-700 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Cetak Laporan PDF
      </button>
    </div>
  );
};

export default MonthlyCommissionReportPreview;
