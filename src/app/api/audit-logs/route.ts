import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { AuditRepository } from "@/repositories/AuditRepository";

const auditRepo = new AuditRepository();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";
  const module = searchParams.get("module") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      auditRepo.findAll({ userId, module, limit, offset }),
      auditRepo.count({ userId, module }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
