import { User, IUser } from "@/models/User";
import { dbConnect } from "@/lib/db/mongodb";

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    await dbConnect();
    return User.findById(id).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    await dbConnect();
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    await dbConnect();
    const user = new User(data);
    return user.save();
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    await dbConnect();
    return User.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<IUser | null> {
    await dbConnect();
    return User.findByIdAndDelete(id).exec();
  }

  async findAll(options: {
    query?: string;
    role?: string;
    status?: string;
    limit: number;
    offset: number;
  }): Promise<IUser[]> {
    await dbConnect();
    const filter: any = {};

    if (options.role) filter.role = options.role;
    if (options.status) filter.status = options.status;
    if (options.query) {
      filter.$or = [
        { name: { $regex: options.query, $options: "i" } },
        { email: { $regex: options.query, $options: "i" } },
      ];
    }

    return User.find(filter)
      .sort({ createdAt: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .exec();
  }

  async count(options: { query?: string; role?: string; status?: string }): Promise<number> {
    await dbConnect();
    const filter: any = {};

    if (options.role) filter.role = options.role;
    if (options.status) filter.status = options.status;
    if (options.query) {
      filter.$or = [
        { name: { $regex: options.query, $options: "i" } },
        { email: { $regex: options.query, $options: "i" } },
      ];
    }

    return User.countDocuments(filter).exec();
  }
}
