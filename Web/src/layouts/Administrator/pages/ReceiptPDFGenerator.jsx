import { jsPDF } from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

// Function to generate and preview PDF
export const generateReceiptPDF = (order, toast) => {
  return new Promise((resolve, reject) => {
    try {
      // Set up PDF document with A6 size (105 x 148 mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a6",
      });

      // Use placeholder data if order is not provided
      const orderData = order || {
        NOMOR_NOTA: "XX.XX.XXX",
        NAMA_PEMBELI: "Customer Name",
        EMAIL_PEMBELI: "customer@email.com",
        WAKTU_TRANSAKSI: new Date().toISOString(),
        WAKTU_PEMBAYARAN: new Date().toISOString(),
        METODE_PENGIRIMAN: "diambil sendiri",
        ITEMS: [],
        TOTAL_BIAYA: 0,
        ONGKIR: 0,
        POIN_TERPAKAI: 0,
        TOTAL_AKHIR: 0,
        POIN_DIPEROLEH: 0,
        TOTAL_POIN_PEMBELI: 0,
        ALAMAT_PENGIRIMAN: "Alamat pengiriman tidak tersedia",
        NAMA_KURIR: "-",
        ID_PEGAWAI_KURIR: "-",
        SCHEDULE_DETAILS: {
          scheduleDate: new Date().toISOString(),
        },
      };

      // Extract values from orderData (based on transaksipenjualans)
      const totalBiaya = orderData.TOTAL_BIAYA || 0;
      const ongkir = orderData.ONGKIR || 0;
      const totalSetelahOngkir = totalBiaya + ongkir;
      const poinTerpakai = orderData.POIN_TERPAKAI || 0;
      const potonganPoin = poinTerpakai * 100;
      const totalAkhir = orderData.TOTAL_AKHIR || 0;
      const poinDiperoleh = orderData.POIN_DIPEROLEH || 0;
      const totalPoinPembeli = orderData.TOTAL_POIN_PEMBELI || 0;

      // Get unique QC information from items
      const qcInfo = [
        ...new Set(
          orderData.ITEMS.map((item) => {
            const qcName = item.NAMA_QC || "Unknown";
            const qcId = item.ID_PEGAWAI_QC || "N/A";
            return `${qcName} (${qcId})`;
          })
        ),
      ].join(", ");

      // Get courier information from transaction
      const kurirInfo =
        orderData.NAMA_KURIR && orderData.NAMA_KURIR !== "-"
          ? `${orderData.NAMA_KURIR}`
          : "Unknown (N/A)";

      // Helper function to format currency
      const formatCurrency = (value) => {
        return new Intl.NumberFormat("id-ID", {
          minimumFractionDigits: 0,
        }).format(value);
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

      // Set font styles
      let yPos = 7;
      pdf.setFont("helvetica");

      // Add company header
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("ReUse Mart", 10, 15, { align: "left" });
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("Jl. Green Eco Park No. 456 Yogyakarta", 10, 19, {
        align: "left",
      });

      // Transaction details
      pdf.setFontSize(8);
      pdf.text("No Nota", 10, 27);
      pdf.text(":", 35, 27);
      pdf.text(`${orderData.NOMOR_NOTA}`, 37, 27);

      pdf.text("Tanggal pesan", 10, 31);
      pdf.text(":", 35, 31);
      pdf.text(
        `${formatDate(orderData.WAKTU_TRANSAKSI)} ${formatTime(
          orderData.WAKTU_TRANSAKSI
        )}`,
        37,
        31
      );

      pdf.text("Lunas pada", 10, 35);
      pdf.text(":", 35, 35);
      pdf.text(
        `${formatDate(
          orderData.WAKTU_PEMBAYARAN || orderData.WAKTU_TRANSAKSI
        )} ${formatTime(
          orderData.WAKTU_PEMBAYARAN || orderData.WAKTU_TRANSAKSI
        )}`,
        37,
        35
      );

      const deliveryMethod =
        orderData.METODE_PENGIRIMAN.toLowerCase() === "dikirim"
          ? "kirim"
          : "ambil";
      pdf.text(`Tanggal ${deliveryMethod}`, 10, 39);
      pdf.text(":", 35, 39);
      pdf.text(
        `${
          orderData.SCHEDULE_DETAILS && orderData.SCHEDULE_DETAILS.scheduleDate
            ? formatDate(orderData.SCHEDULE_DETAILS.scheduleDate)
            : "Belum dijadwalkan"
        }`,
        37,
        39
      );

      yPos = yPos + 41;

      // Buyer information
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("Pembeli :", 10, yPos);

      pdf.setFont("helvetica", "normal");
      const buyerInfo = `${orderData.EMAIL_PEMBELI || ""} / ${
        orderData.NAMA_PEMBELI
      }`;
      const splitBuyerInfo = pdf.splitTextToSize(buyerInfo, 60);
      pdf.text(splitBuyerInfo, 23, yPos);
      yPos += splitBuyerInfo.length * 4;

      const splitAddress = pdf.splitTextToSize(orderData.ALAMAT_PENGIRIMAN, 70);
      pdf.text(splitAddress, 10, yPos);
      yPos += splitAddress.length * 4;

      if (orderData.METODE_PENGIRIMAN !== "diambil sendiri") {
        pdf.text("Delivery :", 10, yPos);
        pdf.text(`Kurir ReUseMart (${kurirInfo})`, 22, yPos);
      } else {
        pdf.text("Delivery", 10, yPos);
        pdf.text(":", 21, yPos);
        pdf.text(`- (${orderData.METODE_PENGIRIMAN})`, 22, yPos);
      }
      yPos += 2;

      // Items table
      const tableColumns = [
        { header: "", dataKey: "name" },
        { header: "", dataKey: "price" },
      ];

      const tableRows = orderData.ITEMS.map((item) => ({
        name: item.NAMA_BARANG,
        price: formatCurrency(item.HARGA),
      }));

      autoTable(pdf, {
        startY: yPos,
        head: [tableColumns.map((col) => col.header)],
        body: tableRows.map((row) => [row.name, row.price]),
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 0,
        },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 20, halign: "right" },
        },
        margin: { left: 10, right: 10 },
      });

      yPos = pdf.lastAutoTable.finalY + 7;

      // Totals
      pdf.text("Total", 10, yPos);
      pdf.text(formatCurrency(totalBiaya), 95, yPos, { align: "right" });
      yPos += 4;

      pdf.text("Ongkos Kirim", 10, yPos);
      pdf.text(formatCurrency(ongkir), 95, yPos, { align: "right" });
      yPos += 4;

      pdf.text("Total", 10, yPos);
      pdf.text(formatCurrency(totalSetelahOngkir), 95, yPos, {
        align: "right",
      });
      yPos += 4;

      pdf.text(`Potongan ${poinTerpakai} poin`, 10, yPos);
      pdf.text(`- ${formatCurrency(potonganPoin)}`, 95, yPos, {
        align: "right",
      });
      yPos += 4;

      // Grand total
      pdf.text("Total", 10, yPos);
      pdf.text(formatCurrency(totalAkhir), 95, yPos, { align: "right" });
      yPos += 8;

      // Points
      pdf.text(`Poin dari pesanan ini: ${poinDiperoleh}`, 10, yPos);
      yPos += 4;
      pdf.text(`Total poin customer: ${totalPoinPembeli}`, 10, yPos);
      yPos += 8;

      // QC information
      pdf.text(`QC oleh: ${qcInfo || "Unknown"}`, 10, yPos);
      yPos += 8;

      // Pickup signature
      pdf.text("Diambil oleh:", 17, yPos);
      yPos += 10;
      pdf.text("(...................................)", 10, yPos);
      yPos += 4;
      pdf.text("Tanggal: ..............................", 10, yPos);

      // Add border to the entire receipt
      pdf.setLineWidth(0.2);
      pdf.rect(5, 5, 95, 138);

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
export const ReceiptPreview = ({ order }) => {
  return (
    <div>
      <button
        onClick={() => generateReceiptPDF(order)}
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
        Lihat Nota PDF
      </button>
    </div>
  );
};

export default ReceiptPreview;
