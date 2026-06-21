import { InventoryTransaction, IInventoryTransaction } from "@/models/InventoryTransaction";
import { dbConnect } from "@/lib/db/mongodb";

export class InventoryRepository {
  async createTransaction(data: Partial<IInventoryTransaction>): Promise<IInventoryTransaction> {
    await dbConnect();
    const transaction = new InventoryTransaction(data);
    return transaction.save();
  }

  async findTransactions(options: {
    productId?: string;
    type?: string;
    userId?: string;
    limit: number;
    offset: number;
  }): Promise<IInventoryTransaction[]> {
    await dbConnect();
    const filter: any = {};

    if (options.productId) filter.productId = options.productId;
    if (options.type) filter.type = options.type;
    if (options.userId) filter.userId = options.userId;

    return InventoryTransaction.find(filter)
      .populate("productId")
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .exec();
  }

  async countTransactions(options: {
    productId?: string;
    type?: string;
    userId?: string;
  }): Promise<number> {
    await dbConnect();
    const filter: any = {};

    if (options.productId) filter.productId = options.productId;
    if (options.type) filter.type = options.type;
    if (options.userId) filter.userId = options.userId;

    return InventoryTransaction.countDocuments(filter).exec();
  }

  // Returns monthly stock in vs stock out for the past 6 months
  async getMovementStats(months = 6): Promise<any[]> {
    await dbConnect();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const stats = await InventoryTransaction.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$type",
          },
          totalQty: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          type: "$_id.type",
          totalQty: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]).exec();

    return stats;
  }
}
