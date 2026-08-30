import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getStudentCredentials } from "@/lib/students.functions";

type Credentials = {
  studentId: string;
  fullName: string;
  username: string;
  password: string | null;
  note: string | null;
};

/**
 * Reveals the system-generated login for one student. The server decides whether
 * the caller (owning school, or the teacher the student is mapped to) may see it.
 */
export function StudentLoginDetailsButton({
  studentId,
  fullName,
  label = "Login details",
}: {
  studentId: string | null | undefined;
  fullName: string;
  label?: string;
}) {
  const reveal = useServerFn(getStudentCredentials);
  const [open, setOpen] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [shown, setShown] = useState(false);

  const mutation = useMutation({
    mutationFn: (id: string) => reveal({ data: { studentId: id } }),
    onSuccess: (data) => {
      setCreds(data);
      setOpen(true);
    },
    onError: (err) => {
      toast.error("Could not load login details", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  if (!studentId) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => {
          setShown(false);
          mutation.mutate(studentId);
        }}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <KeyRound className="h-3.5 w-3.5" />
        )}
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login details</DialogTitle>
            <DialogDescription>
              {creds?.fullName ?? fullName} — read these out to the student. They are not shown
              anywhere else.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Username</div>
              <div className="font-mono text-base font-semibold">{creds?.username ?? "—"}</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Password</div>
              <div className="font-mono text-base font-semibold">
                {creds?.password ? (shown ? creds.password : "••••••••••") : "Not available"}
              </div>
              {creds?.note ? (
                <p className="mt-2 text-xs text-muted-foreground">{creds.note}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {creds?.password ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => setShown((v) => !v)}>
                  {shown ? "Hide password" : "Show password"}
                </Button>
                <Button
                  type="button"
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `Username: ${creds.username}\nPassword: ${creds.password}`,
                    );
                    toast.success("Login details copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
