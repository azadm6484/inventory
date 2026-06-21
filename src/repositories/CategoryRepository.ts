import { Category, ICategory } from "@/models/Category";
import { dbConnect } from "@/lib/db/mongodb";

export class CategoryRepository {
  async findById(id: string): Promise<ICategory | null> {
    await dbConnect();
    return Category.findById(id).exec();
  }

  async findByName(name: string): Promise<ICategory | null> {
    await dbConnect();
    return Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } }).exec();
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    await dbConnect();
    const category = new Category(data);
    return category.save();
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    await dbConnect();
    return Category.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<ICategory | null> {
    await dbConnect();
    return Category.findByIdAndDelete(id).exec();
  }

  async findAll(options: {
    query?: string;
    status?: string;
    limit?: number;
    offset?: number;
    sortKey?: string;
    sortOrder?: "asc" | "desc";
  }): Promise<ICategory[]> {
    await dbConnect();
    const filter: any = {};

    if (options.status) filter.status = options.status;
    if (options.query) {
      filter.name = { $regex: options.query, $options: "i" };
    }

    const sort: any = {};
    if (options.sortKey) {
      sort[options.sortKey] = options.sortOrder === "desc" ? -1 : 1;
    } else {
      sort.name = 1;
    }

    let queryBuilder = Category.find(filter).sort(sort);

    if (options.offset !== undefined) queryBuilder = queryBuilder.skip(options.offset);
    if (options.limit !== undefined) queryBuilder = queryBuilder.limit(options.limit);

    return queryBuilder.exec();
  }

  async count(options: { query?: string; status?: string }): Promise<number> {
    await dbConnect();
    const filter: any = {};

    if (options.status) filter.status = options.status;
    if (options.query) {
      filter.name = { $regex: options.query, $options: "i" };
    }

    return Category.countDocuments(filter).exec();
  }
}
