import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useServerFn } from "@tanstack/react-start";
import { listMyNotifications, markNotificationsRead } from "@/lib/learning.functions";
import { Link } from "@tanstack/react-router";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export function NotificationsBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const load = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationsRead);

  async function refresh() {
    try {
      const rows = (await load()) as Notif[];
      setItems(rows);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = items.filter((i) => !i.read).length;

  async function handleOpenChange(v: boolean) {
    setOpen(v);
    if (v && unread > 0) {
      try {
        await markRead({ data: {} });
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b border-border/60 p-4">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-xs text-muted-foreground">
            {items.length === 0 ? "You're all caught up." : `${items.length} recent`}
          </div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            items.map((n) => (
              <NotifRow key={n.id} n={n} onNavigate={() => setOpen(false)} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotifRow({ n, onNavigate }: { n: Notif; onNavigate: () => void }) {
  const body = (
    <div className={`flex flex-col gap-1 border-b border-border/60 p-4 hover:bg-muted/40 ${n.read ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{n.title}</div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{n.type}</span>
      </div>
      {n.message && <div className="text-xs text-muted-foreground">{n.message}</div>}
      <div className="text-[10px] text-muted-foreground">
        {new Date(n.created_at).toLocaleString()}
      </div>
    </div>
  );
  if (n.link) {
    return (
      <Link to={n.link} onClick={onNavigate}>
        {body}
      </Link>
    );
  }
  return body;
}