import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { Notification } from "@/models/Notification";
import { dbConnect } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    await dbConnect();
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      Notification.countDocuments({ userId }).exec(),
      Notification.countDocuments({ userId, read: false }).exec(),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  try {
    await dbConnect();
    if (body.markAllRead) {
      await Notification.updateMany({ userId, read: false }, { read: true }).exec();
      return NextResponse.json({ message: "All notifications marked as read." });
    }

    if (body.id) {
      await Notification.findOneAndUpdate({ _id: body.id, userId }, { read: true }).exec();
      return NextResponse.json({ message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
