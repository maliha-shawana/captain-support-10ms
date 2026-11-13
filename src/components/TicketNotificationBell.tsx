import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, MessageCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getTicketNotifications, markAllTicketNotificationsRead, markTicketNotificationRead } from "@/lib/notifications.functions";

export function TicketNotificationBell() {
  const fetchNotifications = useServerFn(getTicketNotifications);
  const markRead = useServerFn(markTicketNotificationRead);
  const markAll = useServerFn(markAllTicketNotificationsRead);
  const client = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isError } = useQuery({
    queryKey: ["ticket-notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });
  const unread = data.filter((item) => !item.is_read).length;
  async function openTicket(item: (typeof data)[number]) {
    try {
      if (!item.is_read) await markRead({ data: { id: item.id } });
      await client.invalidateQueries({ queryKey: ["ticket-notifications"] });
      navigate({ to: "/student/issues/$id", params: { id: item.ticket_id } });
    } catch { toast.error("নোটিফিকেশন খোলা যায়নি।"); }
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative shrink-0 rounded-xl" aria-label={`Notifications, ${unread} unread`}>
          <Bell className="size-5" />
          {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#a71930] px-1 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,390px)] overflow-hidden rounded-2xl p-0 shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div><h3 className="font-semibold">নোটিফিকেশন</h3><p className="text-xs text-muted-foreground">{unread}টি নতুন আপডেট</p></div>
          {unread > 0 && <Button size="sm" variant="ghost" onClick={async () => { try { await markAll(); await client.invalidateQueries({ queryKey: ["ticket-notifications"] }); } catch { toast.error("আবার চেষ্টা করুন।"); } }}><CheckCheck className="mr-1 size-4" />সব পড়া হয়েছে</Button>}
        </div>
        <div className="max-h-[390px] overflow-y-auto">
          {isError && <p className="p-5 text-sm text-destructive">নোটিফিকেশন লোড হয়নি।</p>}
          {!isError && data.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">এখনো কোনো নোটিফিকেশন নেই।</p>}
          {data.map((item) => <button key={item.id} type="button" onClick={() => openTicket(item)} className={`flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60 ${!item.is_read ? "bg-rose-50/70 dark:bg-rose-950/20" : ""}`}>
            <span className="mt-1 rounded-lg bg-muted p-2">{item.kind === "reply" ? <MessageCircle className="size-4" /> : <RefreshCw className="size-4" />}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.kind === "reply" ? "সাপোর্ট টিম উত্তর দিয়েছে" : "সমস্যার স্ট্যাটাস পরিবর্তন হয়েছে"}</span><span className="block truncate text-xs font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.body}</span><span className="mt-1 block text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString("bn-BD")}</span></span>
            {!item.is_read && <span className="mt-2 size-2 shrink-0 rounded-full bg-red-600" />}
          </button>)}
        </div>
      </PopoverContent>
    </Popover>
  );
}
