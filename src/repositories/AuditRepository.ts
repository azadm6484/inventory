import { AuditLog, IAuditLog } from "@/models/AuditLog";
import { dbConnect } from "@/lib/db/mongodb";

export class AuditRepository {
  async create(data: Partial<IAuditLog>): Promise<IAuditLog> {
    await dbConnect();
    const log = new AuditLog(data);
    return log.save();
  }

  async findAll(options: {
    userId?: string;
    module?: string;
    limit: number;
    offset: number;
  }): Promise<IAuditLog[]> {
    await dbConnect();
    const filter: any = {};
    if (options.userId) filter.userId = options.userId;
    if (options.module) filter.module = options.module;

    return AuditLog.find(filter)
      .populate("userId")
      .sort({ timestamp: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .exec();
  }

  async count(options: { userId?: string; module?: string }): Promise<number> {
    await dbConnect();
    const filter: any = {};
    if (options.userId) filter.userId = options.userId;
    if (options.module) filter.module = options.module;

    return AuditLog.countDocuments(filter).exec();
  }
}
