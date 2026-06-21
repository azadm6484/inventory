import { AuditRepository } from "@/repositories/AuditRepository";

const auditRepository = new AuditRepository();

export class AuditService {
  static async log(params: {
    userId?: string;
    action: string;
    module: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Execute asynchronously to not block the main user request
    try {
      await auditRepository.create({
        userId: params.userId as any,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
        newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }
}
