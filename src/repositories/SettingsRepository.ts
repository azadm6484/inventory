import { Settings, ISettings } from "@/models/Settings";
import { dbConnect } from "@/lib/db/mongodb";

export class SettingsRepository {
  async getSettings(): Promise<ISettings> {
    await dbConnect();
    let settings = await Settings.findOne({ key: "global" }).exec();

    if (!settings) {
      settings = new Settings({
        key: "global",
        companyName: "Enterprise Inventory",
        passwordMinLength: 8,
        requireUppercase: false,
        requireNumbers: false,
        requireSpecialChars: false,
        sessionTimeoutMinutes: 30,
        maxLoginAttempts: 5,
        lockoutDurationMinutes: 15,
      });
      await settings.save();
    }

    return settings;
  }

  async updateSettings(data: Partial<ISettings>): Promise<ISettings> {
    await dbConnect();
    const settings = await this.getSettings();
    
    // SMTP fields can be updated, let's update them if present
    Object.keys(data).forEach((key) => {
      const val = (data as any)[key];
      if (val !== undefined) {
        (settings as any)[key] = val;
      }
    });

    return settings.save();
  }
}
