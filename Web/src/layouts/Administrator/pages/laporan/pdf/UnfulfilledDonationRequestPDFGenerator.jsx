import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

// Function to generate and preview PDF for unfulfilled donation request report
export const generateUnfulfilledDonationRequestPDF = (reportData, toast) => {
  return new Promise((resolve, reject) => {
    try {
      // Set up PDF document with A4 size (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: "portrait",
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

      // Prepare header content
      const headerLines = [
        "ReUse Mart",
        "Jl. Green Eco Park No. 456 Yogyakarta",
        "", // Empty line for spacing
        "LAPORAN REQUEST DONASI",
        `Tanggal cetak: ${currentDate}`,
      ];

      // Prepare table data with header row
      const tableData = [
        // Header row (merged across all columns for custom header)
        [
          {
            content: "",
            colSpan: 4,
            styles: {
              fontSize: 10,
              halign: "left",
              valign: "top",
              minCellHeight: 28, // Adjusted for 6 header lines
              cellPadding: 5,
            },
          },
        ],
        // Column headers
        [
          {
            content: "ID Organisasi",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Nama Organisasi",
            styles: { fontStyle: "bold", halign: "left" },
          },
          { content: "Alamat", styles: { fontStyle: "bold", halign: "left" } },
          { content: "Request", styles: { fontStyle: "bold", halign: "left" } },
        ],
      ];

      // Add data rows
      reportData.forEach((item) => {
        tableData.push([
          item.id_organisasi || "-",
          item.nama_organisasi || "-",
          item.alamat || "-",
          item.request || "-",
        ]);
      });

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
          0: { cellWidth: 25, halign: "left" },
          1: { cellWidth: 33, halign: "left" },
          2: { cellWidth: 40, halign: "left" },
          395: { cellWidth: 60, halign: "left" },
        },
        margin: { left: 20, right: 20 },
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
              if (line === "ReUse Mart" || line === "LAPORAN REQUEST DONASI") {
                pdf.setFont("helvetica", "bold");
              } else {
                pdf.setFont("helvetica", "normal");
              }
              if (line) {
                pdf.text(line, x, y);
                if (line === "LAPORAN REQUEST DONASI BELUM TERPENUHI") {
                  const textWidth = pdf.getTextWidth(line);
                  pdf.line(x, y + 1, x + textWidth, y + 1);
                  y += 2;
                } else {
                  y += 1;
                }
              }
              y += 4;
            });
          }
        },
        // Ensure table header repeats on new pages
        didParseCell: (data) => {
          if (data.section === "head" && data.row.index === 1) {
            data.cell.styles.fillColor = [255, 255, 255]; // White background for header
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

// Create a standalone preview component for unfulfilled donation request report
export const UnfulfilledDonationRequestReportPreview = ({ reportData }) => {
  return (
    <div>
      <button
        onClick={() => generateUnfulfilledDonationRequestPDF(reportData)}
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

export default UnfulfilledDonationRequestReportPreview;
