import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

// Function to generate and preview PDF for penitip transaction report
export const generatePenitipTransactionPDF = (
  penitipData,
  month,
  year,
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

      // Get month name
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
      const monthName = months[month - 1];

      // Prepare header content
      const headerLines = [
        "ReUse Mart",
        "Jl. Green Eco Park No. 456 Yogyakarta",
        "", // Empty line for spacing
        "LAPORAN TRANSAKSI PENITIP",
        `ID Penitip: ${penitipData.id_penitip}`,
        `Nama Penitip: ${penitipData.nama_penitip}`,
        `Bulan: ${monthName}`,
        `Tahun: ${year}`,
        `Tanggal cetak: ${currentDate}`,
      ];

      // Prepare table data with header row
      const tableData = [
        // Header row (merged across all columns for custom header)
        [
          {
            content: "",
            colSpan: 7,
            styles: {
              fontSize: 10,
              halign: "left",
              valign: "top",
              minCellHeight: 48, // Increased to accommodate extra lines
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
            content: "Tanggal Masuk",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Tanggal Laku",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Harga Jual Bersih (sudah dipotong komisi)",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Bonus Terjual Cepat",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Pendapatan",
            styles: { fontStyle: "bold", halign: "left" },
          },
        ],
      ];

      // Add data rows
      penitipData.items.forEach((item) => {
        tableData.push([
          item.kode_produk || "-",
          item.nama_produk || "-",
          item.tanggal_penitipan || "-",
          item.tanggal_pembayaran ? item.tanggal_pembayaran.split(" ")[0] : "-",
          formatCurrency(item.komisi_penitip),
          formatCurrency(item.bonus),
          formatCurrency(item.total_pendapatan),
        ]);
      });

      // Add total row
      tableData.push([
        {
          content: "Total",
          colSpan: 4,
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: formatCurrency(penitipData.total_komisi),
          styles: { fontStyle: "bold", halign: "center" },
        },
        {
          content: formatCurrency(penitipData.total_bonus),
          styles: { fontStyle: "bold", halign: "center" },
        },
        {
          content: formatCurrency(penitipData.total_pendapatan),
          styles: { fontStyle: "bold", halign: "center" },
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
          0: { cellWidth: 20, halign: "left" },
          1: { cellWidth: 43, halign: "left" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 25, halign: "center" },
          4: { cellWidth: 48, halign: "center" },
          5: { cellWidth: 48, halign: "center" },
          6: { cellWidth: 48, halign: "center" },
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
              if (
                line === "ReUse Mart" ||
                line === "LAPORAN TRANSAKSI PENITIP"
              ) {
                pdf.setFont("helvetica", "bold");
              } else {
                pdf.setFont("helvetica", "normal");
              }
              if (line) {
                pdf.text(line, x, y);
                if (line === "LAPORAN TRANSAKSI PENITIP") {
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

// Create a standalone preview component for penitip transaction report
export const PenitipTransactionReportPreview = ({
  penitipData,
  month,
  year,
}) => {
  return (
    <div>
      <button
        onClick={() => generatePenitipTransactionPDF(penitipData, month, year)}
        className="bg-stone-500 text-white px-4 py-2 rounded-md hover:bg-stone-700 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 2 0 00-.293-.707l-5.414-5.414A1 2 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        Cetak Laporan PDF
      </button>
    </div>
  );
};

export default PenitipTransactionReportPreview;
