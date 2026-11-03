import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";

// Function to generate and preview PDF
export const generateMonthlySalesPDF = (salesData, selectedYear, toast) => {
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

      // Calculate totals
      const totalBarang = salesData.reduce(
        (sum, item) => sum + (item.total_transaksi || 0),
        0
      );
      const totalPenjualan = salesData.reduce(
        (sum, item) => sum + (item.total_biaya || 0),
        0
      );

      // Prepare header content for manual drawing
      const headerLines = [
        "ReUse Mart",
        "Jl. Green Eco Park No. 456 Yogyakarta",
        "", // Empty line for spacing
        "LAPORAN PENJUALAN BULANAN",
        `Tahun: ${selectedYear}`, // Use selectedYear instead of current year
        `Tanggal cetak: ${currentDate}`,
      ];

      // Prepare table data with header row
      const tableData = [
        // Header row (merged across all columns, empty content)
        [
          {
            content: "", // Empty to prevent default rendering
            colSpan: 3,
            styles: {
              fontSize: 10,
              halign: "left",
              valign: "top",
              minCellHeight: 30,
              cellPadding: 5,
            },
          },
        ],
        // Column headers
        [
          { content: "Bulan", styles: { fontStyle: "bold", halign: "left" } },
          {
            content: "Jumlah Barang Terjual",
            styles: { fontStyle: "bold", halign: "left" },
          },
          {
            content: "Jumlah Penjualan Kotor",
            styles: { fontStyle: "bold", halign: "left" },
          },
        ],
      ];

      // Add data rows
      salesData.forEach((item) => {
        tableData.push([
          item.bulan,
          (item.total_transaksi || 0).toString(),
          `Rp${(item.total_biaya || 0).toLocaleString("id-ID")}`,
        ]);
      });

      // Add empty rows if needed
      const emptyRowsNeeded = Math.max(0, 10 - salesData.length);
      for (let i = 0; i < emptyRowsNeeded; i++) {
        tableData.push(["...", "...", "..."]);
      }

      // Add total row
      tableData.push([
        {
          content: "Total",
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "right" },
        },
        {
          content: `Rp${totalPenjualan.toLocaleString("id-ID")}`,
          styles: { fontStyle: "bold", halign: "left" },
        },
      ]);

      // Generate the main table
      autoTable(pdf, {
        startY: 20,
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
          0: { cellWidth: 30, halign: "left" },
          1: { cellWidth: 45, halign: "left" },
          2: { cellWidth: 45, halign: "left" },
        },
        margin: { left: 20, right: 70 },
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
                line === "LAPORAN PENJUALAN BULANAN"
              ) {
                pdf.setFont("helvetica", "bold");
              } else {
                pdf.setFont("helvetica", "normal");
              }
              if (line) {
                // Only draw non-empty lines
                pdf.text(line, x, y);
                if (line === "LAPORAN PENJUALAN BULANAN") {
                  // Draw underline
                  const textWidth = pdf.getTextWidth(line);
                  pdf.line(x, y + 1, x + textWidth, y + 1);
                  y += 2; // 1mm below text
                }
              }
              y += 4; // Extra spacing after address and empty line
            });
          }
        },
      });

      // Add some spacing before the chart section
      const chartStartY = pdf.lastAutoTable.finalY + 12;

      // Add chart section title
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("GRAFIK PENJUALAN BULANAN", 20, chartStartY);

      // Create a hidden canvas element in the DOM
      const canvas = document.createElement("canvas");
      canvas.style.display = "none";
      canvas.width = 800;
      canvas.height = 400;
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");

      // Create and render the chart
      const chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: salesData.map((item) => item.bulan),
          datasets: [
            {
              label: "Jumlah Penjualan (Rp)",
              data: salesData.map((item) => item.total_biaya || 0),
              backgroundColor: "rgba(119, 120, 74, 0.8)",
              borderColor: "rgba(119, 120, 74, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
            },
            title: {
              display: true,
              text: "Penjualan Bulanan",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `Rp${value.toLocaleString("id-ID")}`,
              },
            },
            x: {
              ticks: {
                maxRotation: 45,
              },
            },
          },
        },
      });

      // Wait for the chart to render and convert to image
      return new Promise((resolveChart) => {
        setTimeout(() => {
          try {
            const chartImage = chart.toBase64Image();
            if (chartImage) {
              // Add chart to PDF
              pdf.addImage(chartImage, "PNG", 20, chartStartY + 10, 170, 100);
            } else {
              console.warn("Chart image generation failed, skipping chart.");
            }
          } catch (chartError) {
            console.warn("Chart rendering error:", chartError);
          }

          // Clean up
          chart.destroy();
          document.body.removeChild(canvas);
          resolveChart();
        }, 500);
      }).then(() => {
        // Generate PDF blob and open in new window
        const pdfBlob = pdf.output("blob");
        const pdfUrl = URL.createObjectURL(pdfBlob);

        const printWindow = window.open(pdfUrl, "_blank");
        if (printWindow) {
          resolve();
        } else {
          toast?.error(
            "Popup diblokir. Harap izinkan popup untuk preview PDF.",
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
          reject(new Error("Popup blocked"));
        }

        setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
      });
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

// Create a standalone preview component for monthly sales report
export const MonthlySalesReportPreview = ({ salesData, selectedYear }) => {
  return (
    <div>
      <button
        onClick={() => generateMonthlySalesPDF(salesData, selectedYear)}
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

export default MonthlySalesReportPreview;
