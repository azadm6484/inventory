import { Supplier, ISupplier } from "@/models/Supplier";
import { dbConnect } from "@/lib/db/mongodb";

export class SupplierRepository {
  async findById(id: string): Promise<ISupplier | null> {
    await dbConnect();
    return Supplier.findById(id).exec();
  }

  async findByEmail(email: string): Promise<ISupplier | null> {
    await dbConnect();
    return Supplier.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: Partial<ISupplier>): Promise<ISupplier> {
    await dbConnect();
    const supplier = new Supplier(data);
    return supplier.save();
  }

  async update(id: string, data: Partial<ISupplier>): Promise<ISupplier | null> {
    await dbConnect();
    return Supplier.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<ISupplier | null> {
    await dbConnect();
    return Supplier.findByIdAndDelete(id).exec();
  }

  async findAll(options: {
    query?: string;
    limit?: number;
    offset?: number;
  }): Promise<ISupplier[]> {
    await dbConnect();
    const filter: any = {};

    if (options.query) {
      filter.$or = [
        { companyName: { $regex: options.query, $options: "i" } },
        { contactPerson: { $regex: options.query, $options: "i" } },
        { email: { $regex: options.query, $options: "i" } },
      ];
    }

    let queryBuilder = Supplier.find(filter).sort({ companyName: 1 });

    if (options.offset !== undefined) queryBuilder = queryBuilder.skip(options.offset);
    if (options.limit !== undefined) queryBuilder = queryBuilder.limit(options.limit);

    return queryBuilder.exec();
  }

  async count(options: { query?: string }): Promise<number> {
    await dbConnect();
    const filter: any = {};

    if (options.query) {
      filter.$or = [
        { companyName: { $regex: options.query, $options: "i" } },
        { contactPerson: { $regex: options.query, $options: "i" } },
        { email: { $regex: options.query, $options: "i" } },
      ];
    }

    return Supplier.countDocuments(filter).exec();
  }
}
