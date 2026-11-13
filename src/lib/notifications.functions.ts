import { createServerFn } from "@tanstack/react-start";
import { requireStudent } from "./session.server";
import { db } from "./support.server";

export const getTicketNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const { studentId } = await requireStudent();
  const { data, error } = await db.from("ticket_notifications")
    .select("id, ticket_id, kind, title, body, is_read, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false }).limit(30);
  if (error) throw new Error("Notifications could not be loaded.");
  return data ?? [];
});

export const markTicketNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { studentId } = await requireStudent();
    const { error } = await db.from("ticket_notifications")
      .update({ is_read: true }).eq("id", data.id).eq("student_id", studentId);
    if (error) throw new Error("Notification could not be marked as read.");
    return { ok: true };
  });

export const markAllTicketNotificationsRead = createServerFn({ method: "POST" })
  .handler(async () => {
    const { studentId } = await requireStudent();
    const { error } = await db.from("ticket_notifications")
      .update({ is_read: true }).eq("student_id", studentId).eq("is_read", false);
    if (error) throw new Error("Notifications could not be marked as read.");
    return { ok: true };
  });
