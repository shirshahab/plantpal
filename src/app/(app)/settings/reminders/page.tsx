import { redirect } from "next/navigation";

/** Reminders settings moved to the unified Notifications settings page. */
export default function RemindersSettingsRedirect() {
  redirect("/settings/notifications");
}
