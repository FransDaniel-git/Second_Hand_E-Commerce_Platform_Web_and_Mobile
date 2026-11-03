import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import axios from "axios";

// Function to fetch all stock data across all pages
const fetchAllStockData = async (lastPage, token) => {
  try {
    const allData = [];
    for (let page = 1; page <= lastPage; page++) {
      const response = await axios.get("/api/owner/stok-gudang", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page },
      });

      if (response.data.success) {
        allData.push(...response.data.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch stock data");
      }
    }
    return allData;
  } catch (err) {
    throw new Error(
      "Gagal mengambil semua data stok: " +
        (err.response?.data?.message || err.message)
    );
  }
};

// Function to generate and preview PDF for warehouse stock report
export const generateWarehouseStockPDF = async (stockData, lastPage, toast) => {
  return new Promise(async (resolve, reject) => {
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

      // Fetch all stock data
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("No authentication token found. Please log in.");
      const allStockData = await fetchAllStockData(lastPage, token);

      // Prepare header content
      const headerLines = [
        "ReUse Mart",
        "Jl. Green Eco Park No. 456 Yogyakarta",
        "", // Empty line for spacing
        "LAPORAN STOK GUDANG",
        `Tanggal cetak: ${currentDate}`,
        "", // Additional empty line for spacing after print date
      ];

      // Prepare table data with header row
      const tableData = [
        // Header row (merged across all columns for custom header)
        [
          {
            content: "",
            colSpan: 9,
            styles: {
              fontSize: 10,
              halign: "left",
              valign: "top",
              minCellHeight: 25, // Adjusted for 6 header lines
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
            content: "ID Penitip",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Nama Penitip",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Tanggal Masuk",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Perpanjangan",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "ID Hunter",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Nama Hunter",
            styles: { fontStyle: "bold", halign: "left" },
          },
          { content: "Harga", styles: { fontStyle: "bold", halign: "left" } },
        ],
      ];

      // Add data rows
      allStockData.forEach((item) => {
        tableData.push([
          item.kode_produk || "-",
          item.nama_produk || "-",
          item.id_penitip || "-",
          item.nama_penitip || "-",
          item.tanggal_masuk || "-",
          item.perpanjangan || "-",
          item.id_hunter || "-",
          item.nama_hunter || "-",
          formatCurrency(item.harga),
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
          0: { cellWidth: 20, halign: "left" },
          1: { cellWidth: 40, halign: "left" },
          2: { cellWidth: 20, halign: "left" },
          3: { cellWidth: 35, halign: "left" },
          4: { cellWidth: 25, halign: "left" },
          5: { cellWidth: 25, halign: "left" },
          6: { cellWidth: 20, halign: "left" },
          7: { cellWidth: 35, halign: "left" },
          8: { cellWidth: 30, halign: "left" },
        },
        margin: { left: 23, right: 24 },
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
              if (line === "ReUse Mart" || line === "LAPORAN STOK GUDANG") {
                pdf.setFont("helvetica", "bold");
              } else {
                pdf.setFont("helvetica", "normal");
              }
              if (line) {
                pdf.text(line, x, y);
                if (line === "LAPORAN STOK GUDANG") {
                  const textWidth = pdf.getTextWidth(line);
                  pdf.line(x, y + 1, x + textWidth, y + 1);
                  y += 2;
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

// Create a standalone preview component for warehouse stock report
export const WarehouseStockReportPreview = ({ stockData, lastPage }) => {
  return (
    <div>
      <button
        onClick={() => generateWarehouseStockPDF(stockData, lastPage)}
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

export default WarehouseStockReportPreview;
