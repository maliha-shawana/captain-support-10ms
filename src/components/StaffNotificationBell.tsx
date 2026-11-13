import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck, FilePlus2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getStaffNotifications,
  markAllStaffNotificationsRead,
  markStaffNotificationRead,
} from "@/lib/staff-notifications.functions";
import { useLanguage } from "@/lib/language-context";

export function StaffNotificationBell() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const getNotifications = useServerFn(getStaffNotifications);
  const markRead = useServerFn(markStaffNotificationRead);
  const markAllRead = useServerFn(markAllStaffNotificationsRead);

  const { data = [], isError, isLoading } = useQuery({
    queryKey: ["staff-notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const unread = data.filter((item) => !item.is_read).length;

  async function openTicket(item: (typeof data)[number]) {
    try {
      if (!item.is_read) {
        await markRead({ data: { id: item.id } });
        await queryClient.invalidateQueries({ queryKey: ["staff-notifications"] });
      }
      setOpen(false);
      await navigate({ to: "/staff/tickets", search: { ticket: item.ticket_id } });
    } catch {
      toast.error(language === "bn" ? "নোটিফিকেশন খোলা যায়নি।" : "Could not open notification.");
    }
  }

  async function markAll() {
    try {
      await markAllRead();
      await queryClient.invalidateQueries({ queryKey: ["staff-notifications"] });
    } catch {
      toast.error(language === "bn" ? "নোটিফিকেশন আপডেট করা যায়নি।" : "Could not update notifications.");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative shrink-0 rounded-xl"
          aria-label={language === "bn" ? `${unread}টি না-পড়া স্টাফ নোটিফিকেশন` : `${unread} unread staff notifications`}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#a71930] px-1 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,400px)] overflow-hidden rounded-2xl p-0 shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <div>
            <h3 className="font-semibold">{language === "bn" ? "স্টাফ নোটিফিকেশন" : "Staff Notifications"}</h3>
            <p className="text-xs text-muted-foreground">
              {language === "bn" ? `${unread}টি নতুন আপডেট` : `${unread} unread updates`}
            </p>
          </div>
          {unread > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={markAll}>
              <CheckCheck className="mr-1 size-4" />
              {language === "bn" ? "সব পড়েছি" : "Mark all read"}
            </Button>
          )}
        </div>
        <div className="max-h-[390px] overflow-y-auto">
          {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>}
          {isError && <p className="p-6 text-center text-sm text-destructive">{language === "bn" ? "নোটিফিকেশন লোড করা যায়নি।" : "Could not load notifications."}</p>}
          {!isLoading && !isError && data.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">{language === "bn" ? "এখনো কোনো নোটিফিকেশন নেই।" : "No notifications yet."}</p>
          )}
          {data.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openTicket(item)}
              className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!item.is_read ? "bg-rose-50/70 dark:bg-rose-950/20" : ""}`}
            >
              <span className="mt-1 rounded-lg bg-muted p-2">
                {item.kind === "new_ticket" ? <FilePlus2 className="size-4" /> : <MessageCircle className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {language === "bn"
                    ? item.kind === "new_ticket" ? "নতুন সমস্যা জমা পড়েছে" : "শিক্ষার্থী নতুন বার্তা দিয়েছে"
                    : item.kind === "new_ticket" ? "New issue reported" : "New student reply"}
                </span>
                <span className="mt-0.5 block truncate text-xs font-medium">{item.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.body}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {new Date(item.created_at).toLocaleString(language === "bn" ? "bn-BD" : "en-US")}
                </span>
              </span>
              {!item.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-red-600" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
