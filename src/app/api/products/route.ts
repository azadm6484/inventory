import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { ProductRepository } from "@/repositories/ProductRepository";
import { productSchema } from "@/validations/product";

const productRepo = new ProductRepository();

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const supplierId = searchParams.get("supplierId") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  try {
    const [products, total] = await Promise.all([
      productRepo.findAll({ query, categoryId, supplierId, status, limit, offset }),
      productRepo.count({ query, categoryId, supplierId, status }),
    ]);

    return NextResponse.json({
      data: products,
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
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const sku = await productRepo.generateNextSku();
    const product = await productRepo.create({ ...validation.data, sku });
    return NextResponse.json({ data: product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
