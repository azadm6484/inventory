import { Product, IProduct } from "@/models/Product";
import { dbConnect } from "@/lib/db/mongodb";

export class ProductRepository {
  async findById(id: string): Promise<IProduct | null> {
    await dbConnect();
    return Product.findById(id).populate("categoryId").populate("supplierId").exec();
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    await dbConnect();
    return Product.findOne({ sku }).populate("categoryId").populate("supplierId").exec();
  }

  async create(data: Partial<IProduct>): Promise<IProduct> {
    await dbConnect();
    const product = new Product(data);
    return product.save();
  }

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    await dbConnect();
    return Product.findByIdAndUpdate(id, data, { new: true })
      .populate("categoryId")
      .populate("supplierId")
      .exec();
  }

  async delete(id: string): Promise<IProduct | null> {
    await dbConnect();
    return Product.findByIdAndDelete(id).exec();
  }

  async generateNextSku(): Promise<string> {
    await dbConnect();
    // Find the product with the highest SKU formatted as PRD-XXXXX
    const lastProduct = await Product.findOne({ sku: /^PRD-\d{5}$/ })
      .sort({ sku: -1 })
      .exec();

    if (!lastProduct) {
      return "PRD-00001";
    }

    const lastSkuNum = parseInt(lastProduct.sku.replace("PRD-", ""), 10);
    const nextSkuNum = lastSkuNum + 1;
    const formattedNum = String(nextSkuNum).padStart(5, "0");
    return `PRD-${formattedNum}`;
  }

  async findAll(options: {
    query?: string;
    categoryId?: string;
    supplierId?: string;
    status?: string;
    limit: number;
    offset: number;
    sortKey?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<IProduct[]> {
    await dbConnect();
    const filter: any = {};

    if (options.categoryId) filter.categoryId = options.categoryId;
    if (options.supplierId) filter.supplierId = options.supplierId;
    if (options.status) filter.status = options.status;
    if (options.query) {
      filter.$or = [
        { name: { $regex: options.query, $options: "i" } },
        { sku: { $regex: options.query, $options: "i" } },
        { barcode: { $regex: options.query, $options: "i" } },
      ];
    }

    const sort: any = {};
    if (options.sortKey) {
      sort[options.sortKey] = options.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    return Product.find(filter)
      .populate("categoryId")
      .populate("supplierId")
      .sort(sort)
      .skip(options.offset)
      .limit(options.limit)
      .exec();
  }

  async count(options: {
    query?: string;
    categoryId?: string;
    supplierId?: string;
    status?: string;
  }): Promise<number> {
    await dbConnect();
    const filter: any = {};

    if (options.categoryId) filter.categoryId = options.categoryId;
    if (options.supplierId) filter.supplierId = options.supplierId;
    if (options.status) filter.status = options.status;
    if (options.query) {
      filter.$or = [
        { name: { $regex: options.query, $options: "i" } },
        { sku: { $regex: options.query, $options: "i" } },
        { barcode: { $regex: options.query, $options: "i" } },
      ];
    }

    return Product.countDocuments(filter).exec();
  }

  async findLowStock(limit = 10): Promise<IProduct[]> {
    await dbConnect();
    return Product.find({
      $expr: { $lte: ["$quantity", "$minimumStock"] },
      status: "ACTIVE",
    })
      .populate("categoryId")
      .populate("supplierId")
      .limit(limit)
      .exec();
  }

  async countLowStock(): Promise<number> {
    await dbConnect();
    return Product.countDocuments({
      $expr: { $lte: ["$quantity", "$minimumStock"] },
      status: "ACTIVE",
    }).exec();
  }

  async countOutOfStock(): Promise<number> {
    await dbConnect();
    return Product.countDocuments({
      quantity: 0,
      status: "ACTIVE",
    }).exec();
  }

  async getInventoryValuation(): Promise<{ totalValue: number; totalCost: number }> {
    await dbConnect();
    const result = await Product.aggregate([
      { $match: { status: "ACTIVE" } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
          totalCost: { $sum: { $multiply: ["$quantity", "$purchasePrice"] } },
        },
      },
    ]).exec();

    if (result.length === 0) {
      return { totalValue: 0, totalCost: 0 };
    }

    return {
      totalValue: result[0].totalValue,
      totalCost: result[0].totalCost,
    };
  }
}
