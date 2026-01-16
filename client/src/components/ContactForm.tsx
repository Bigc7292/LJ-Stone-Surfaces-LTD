import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInquirySchema, type InsertInquiry } from "@shared/schema";
import { useCreateInquiry } from "@/hooks/use-inquiries";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const { mutate, isPending } = useCreateInquiry();
  
  const form = useForm<InsertInquiry>({
    resolver: zodResolver(insertInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  const onSubmit = (data: InsertInquiry) => {
    mutate(data, {
      onSuccess: () => {
        form.reset();
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Your Name</label>
          <input
            {...form.register("name")}
            className="w-full bg-secondary border border-white/10 p-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            placeholder="John Doe"
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Email Address</label>
          <input
            {...form.register("email")}
            type="email"
            className="w-full bg-secondary border border-white/10 p-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            placeholder="john@example.com"
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number (Optional)</label>
        <input
          {...form.register("phone")}
          className="w-full bg-secondary border border-white/10 p-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          placeholder="+1 (555) 000-0000"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Message</label>
        <textarea
          {...form.register("message")}
          rows={5}
          className="w-full bg-secondary border border-white/10 p-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
          placeholder="Tell us about your project..."
        />
        {form.formState.errors.message && (
          <p className="text-destructive text-xs">{form.formState.errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-10 py-4 bg-primary text-black font-semibold uppercase tracking-widest hover:bg-white transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Sending...
          </>
        ) : (
          "Send Inquiry"
        )}
      </button>
    </form>
  );
}
