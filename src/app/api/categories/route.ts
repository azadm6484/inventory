import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { CategoryRepository } from "@/repositories/CategoryRepository";
import { categorySchema } from "@/validations/category";

const categoryRepo = new CategoryRepository();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;
  const all = searchParams.get("all") === "true";

  try {
    if (all) {
      const categories = await categoryRepo.findAll({ status: "ACTIVE" });
      return NextResponse.json({ data: categories });
    }

    const [categories, total] = await Promise.all([
      categoryRepo.findAll({ query, status, limit, offset }),
      categoryRepo.count({ query, status }),
    ]);

    return NextResponse.json({
      data: categories,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = categorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const category = await categoryRepo.create(validation.data);
    return NextResponse.json({ data: category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
