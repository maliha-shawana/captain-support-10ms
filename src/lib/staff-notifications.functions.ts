import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "./session.server";
import { db } from "./support.server";

export type StaffNotification = {
  id: string;
  ticket_id: string;
  kind: "new_ticket" | "student_reply";
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
};

/** Staff-only feed. Read status is personal to each staff member. */
export const getStaffNotifications = createServerFn({ method: "GET" }).handler(async () => {
  const { staffId } = await requireStaff();
  // The notification tables are new and are not in the existing generated DB types.
  const { data: notifications, error } = await (db as any)
    .from("staff_notifications")
    .select("id, ticket_id, kind, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("স্টাফ নোটিফিকেশন লোড করা যায়নি।");

  const items = (notifications ?? []) as Omit<StaffNotification, "is_read">[];
  if (!items.length) return [] as StaffNotification[];

  const { data: reads, error: readsError } = await (db as any)
    .from("staff_notification_reads")
    .select("notification_id")
    .eq("staff_id", staffId)
    .in("notification_id", items.map((n) => n.id));
  if (readsError) throw new Error("নোটিফিকেশনের read status লোড করা যায়নি।");
  const readIds = new Set<string>((reads ?? []).map((r: { notification_id: string }) => r.notification_id));
  return items.map((n) => ({ ...n, is_read: readIds.has(n.id) }));
});

/** Mark one notification read for this staff account only. */
export const markStaffNotificationRead = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const { staffId } = await requireStaff();
    const { error } = await (db as any).from("staff_notification_reads").upsert(
      { notification_id: data.id, staff_id: staffId },
      { onConflict: "notification_id,staff_id", ignoreDuplicates: true },
    );
    if (error) throw new Error("নোটিফিকেশন read করা যায়নি।");
    return { ok: true };
  });

/** Mark the latest 50 notifications read for this staff account only. */
export const markAllStaffNotificationsRead = createServerFn({ method: "POST" }).handler(async () => {
  const { staffId } = await requireStaff();
  const { data: notifications, error } = await (db as any)
    .from("staff_notifications")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error("নোটিফিকেশন লোড করা যায়নি।");
  if (!notifications?.length) return { ok: true };
  const { error: writeError } = await (db as any).from("staff_notification_reads").upsert(
    notifications.map((n: { id: string }) => ({ notification_id: n.id, staff_id: staffId })),
    { onConflict: "notification_id,staff_id", ignoreDuplicates: true },
  );
  if (writeError) throw new Error("নোটিফিকেশন read করা যায়নি।");
  return { ok: true };
});
