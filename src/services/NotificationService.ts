import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { dbConnect } from "@/lib/db/mongodb";

export class NotificationService {
  static async notifyUser(params: {
    userId: string;
    title: string;
    message: string;
    type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  }) {
    try {
      await dbConnect();
      const notification = new Notification({
        userId: params.userId as any,
        title: params.title,
        message: params.message,
        type: params.type || "INFO",
        read: false,
        createdAt: new Date(),
      });
      await notification.save();
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  }

  static async notifyAdmins(params: {
    title: string;
    message: string;
    type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  }) {
    try {
      await dbConnect();
      const admins = await User.find({ role: "ADMIN", status: "ACTIVE" }).select("_id").exec();
      if (admins.length === 0) return;

      const notifications = admins.map((admin) => ({
        userId: admin._id,
        title: params.title,
        message: params.message,
        type: params.type || "INFO",
        read: false,
        createdAt: new Date(),
      }));

      await Notification.insertMany(notifications);
    } catch (error) {
      console.error("Failed to create admin notifications:", error);
    }
  }
}
