import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

// Function to generate and preview PDF
export const generateReceiptPenitipanPDF = (order, toast) => {
  return new Promise((resolve, reject) => {
    try {
      // Set up PDF document with A7 size (74 x 105 mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a7",
      });

      // Use placeholder data if order is not provided
      const orderData = order || {
        NO_NOTA_PENITIPAN: "XX.XX.XXX",
        ID_PENITIP: "PXX",
        NAMA_PENITIP: "Penitip Name",
        ALAMAT: "Alamat penitip tidak tersedia",
        TANGGAL_PENITIPAN: new Date().toISOString(),
        TANGGAL_KADALUARSA: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        NAMA_PEGAWAI_QC: "Unknown",
        ID_PEGAWAI_QC: "N/A",
        BARANG_TITIPAN: [],
      };

      // Calculate TANGGAL_KADALUARSA if not provided
      const tanggalKadaluarsa =
        orderData.TANGGAL_KADALUARSA ||
        new Date(
          new Date(orderData.TANGGAL_PENITIPAN).getTime() +
            30 * 24 * 60 * 60 * 1000
        ).toISOString();

      // Helper function to format currency
      const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
          minimumFractionDigits: 0,
        }).format(value);
      };

      // Helper function to format weight
      const formatWeight = (value) => {
        return value ? `Berat barang: ${value} KG` : "Berat: -";
      };

      // Format dates
      const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        });
      };

      const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      };

      const formatWarrantyDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });
      };

      // Check warranty status
      const getWarrantyStatus = (warrantyDate, status) => {
        if (!warrantyDate) return "";
        const currentDate = new Date();
        const warranty = new Date(warrantyDate);
        if (currentDate <= warranty) {
          return `Garansi ON ${formatWarrantyDate(warrantyDate)}`;
        }
        // if (status === "Tersedia") {
        //   return `Garansi OFF ${formatWarrantyDate(warrantyDate)}`;
        // }
        return "";
      };

      // Calculate scaling factor based on item count
      const itemCount = orderData.BARANG_TITIPAN.length;
      const scaleFactor = Math.max(0.75, 1 - 0.08 * (itemCount - 2));
      const baseFontSize = 8;
      const fontSize = baseFontSize * scaleFactor;
      const headerFontSize = 12 * scaleFactor;
      const lineHeightFactor = Math.max(1, 1.2 * scaleFactor); // Min 1 to avoid overlap

      // Set font styles
      let yPos = 7 * scaleFactor;
      pdf.setFont("helvetica");

      // Add company header
      pdf.setFontSize(headerFontSize);
      pdf.setFont("helvetica", "bold");
      pdf.text("ReUse Mart", 10, 15 * scaleFactor, { align: "left" });
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "normal");
      pdf.text("Jl. Green Eco Park No. 456 Yogyakarta", 10, 19 * scaleFactor, {
        align: "left",
      });

      // Transaction details
      pdf.setFontSize(fontSize);
      pdf.text("No Nota", 10, 27 * scaleFactor);
      pdf.text(":", 37 * scaleFactor, 27 * scaleFactor);
      pdf.text(
        `${orderData.NO_NOTA_PENITIPAN}`,
        39 * scaleFactor,
        27 * scaleFactor
      );

      pdf.text("Tanggal Penitipan", 10, 31 * scaleFactor);
      pdf.text(":", 37 * scaleFactor, 31 * scaleFactor);
      pdf.text(
        `${formatDate(orderData.TANGGAL_PENITIPAN)} ${formatTime(
          orderData.TANGGAL_PENITIPAN
        )}`,
        39 * scaleFactor,
        31 * scaleFactor
      );

      pdf.text("Masa penitipan sampai", 10, 35 * scaleFactor);
      pdf.text(":", 40 * scaleFactor + 2, 35 * scaleFactor);
      pdf.text(
        `${formatDate(tanggalKadaluarsa)}`,
        42 * scaleFactor + 2,
        35 * scaleFactor
      );

      yPos = yPos + 36 * scaleFactor;

      // Penitip information
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", "bold");
      pdf.text("Penitip :", 10, yPos);

      pdf.setFont("helvetica", "normal");
      const penitipInfo = `${orderData.ID_PENITIP} / ${orderData.NAMA_PENITIP}`;
      const splitPenitipInfo = pdf.splitTextToSize(
        penitipInfo,
        60 * scaleFactor
      );
      pdf.text(splitPenitipInfo, 25 * scaleFactor, yPos);
      yPos += splitPenitipInfo.length * (fontSize / 2);

      const splitAddress = pdf.splitTextToSize(
        orderData.ALAMAT || "-",
        45 * scaleFactor
      );
      pdf.text(splitAddress, 10, yPos);
      yPos += splitAddress.length;

      // Items table
      // Items table
      const tableColumns = [
        { header: "", dataKey: "name" },
        { header: "", dataKey: "price" },
      ];

      const tableRows = orderData.BARANG_TITIPAN.map((item) => {
        const warrantyText = getWarrantyStatus(
          item.tanggal_garansi,
          item.status_barang
        );
        const weightText = formatWeight(item.berat);
        const nameWithDetails = warrantyText
          ? `${item.nama}\n${warrantyText}\n${weightText}`
          : `${item.nama}\n${weightText}`;
        return {
          name: nameWithDetails,
          price: formatCurrency(item.harga_jual.replace(/[^0-9]/g, "")),
        };
      });

      autoTable(pdf, {
        startY: yPos,
        head: [tableColumns.map((col) => col.header)],
        body: tableRows.map((row) => [row.name, row.price]),
        theme: "plain",
        styles: {
          fontSize: fontSize,
          cellPadding: {
            top: 1 * scaleFactor,
            bottom: 0 * scaleFactor,
            left: 0.5 * scaleFactor,
            right: 0.5 * scaleFactor, // Base padding for non-price columns
          },
          overflow: "linebreak",
          lineHeightFactor: lineHeightFactor,
        },
        columnStyles: {
          0: { cellWidth: 33 }, // Name column width
          1: {
            cellWidth: 23, // Price column width
            halign: "right", // Right-align text
            cellPadding: {
              right: 3, // Fixed right padding (in mm) to ensure consistent right margin
            },
          },
        },
        margin: { left: 10, right: 10 },
      });
      yPos = pdf.lastAutoTable.finalY + 8 * scaleFactor;

      // QC information
      pdf.setFontSize(fontSize);
      pdf.text("Diterima dan QC oleh:", 15, yPos);
      yPos += 13 * scaleFactor;
      pdf.text(
        `${orderData.ID_PEGAWAI_QC} - ${
          orderData.NAMA_PEGAWAI_QC || "Unknown"
        }`,
        15,
        yPos
      );

      // Add border to the entire receipt
      pdf.setLineWidth(0.2);
      pdf.rect(5, 5, 64, 95);

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

// Create a standalone preview component for receipt
export const ReceiptPenitipanPreview = ({ order }) => {
  return (
    <div>
      <button
        onClick={() => generateReceiptPenitipanPDF(order)}
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
        Cetak Nota PDF
      </button>
    </div>
  );
};

export default ReceiptPenitipanPreview;
