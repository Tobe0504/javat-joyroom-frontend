"use client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function (toast) {
        const { id, title, description, action, variant, ...props } = toast as {
          id: string;
          title?: React.ReactNode;
          description?: React.ReactNode;
          action?: React.ReactNode;
          variant?: "success" | "error" | "default";
        };

        return (
          <Toast
            key={id}
            {...props}
            className={cn(
              "border shadow-lg p-4 rounded-md bg-background",
              variant === "success" &&
                "border-green-600 bg-green-50 text-green-800",
              variant === "error" && "border-red-600 bg-red-50 text-red-800",
              variant === "default" && "border-gray-300"
            )}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
