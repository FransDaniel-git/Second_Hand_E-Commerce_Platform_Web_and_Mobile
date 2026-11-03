class Commission {
  final String commissionId;
  final String productName;
  final String penitipName;
  final int amount;
  final String date;
  final String status;
  final String imagePath;
  final String transactionDate;
  final String consignmentDate;
  final int sellingPrice;

  Commission({
    required this.commissionId,
    required this.productName,
    required this.penitipName,
    required this.amount,
    required this.date,
    required this.status,
    required this.imagePath,
    required this.transactionDate,
    required this.consignmentDate,
    required this.sellingPrice,
  });
}
