"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Field, FieldError, Select } from "@/components/ui/field";
import { Button, Card } from "@/components/ui/primitives";
import { submitEnquiry } from "@/lib/mock/api";

const TOPICS = { general: "General enquiry", membership: "Membership", events: "Events & registration", publications: "Publications", she: "Safety / SHE training" };

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email"),
  organisation: z.string().trim().optional(),
  topic: z.string().min(1, "Choose a topic"),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)"),
  website: z.string().max(0).optional(), // honeypot
});
type Values = z.infer<typeof schema>;

export function EnquiryForm() {
  const search = useSearchParams();
  const initialTopic = search.get("topic") ?? "";
  const [ref, setRef] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { topic: initialTopic in TOPICS ? initialTopic : "" },
  });
  const e = formState.errors;

  if (ref)
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h2 className="mt-4 text-2xl font-extrabold">Thank you, we’ve received your message</h2>
        <p className="mt-2 text-ink-500">
          Reference <span className="font-mono text-ink-900">{ref}</span>. The secretariat has been notified and will reply
          by email.
        </p>
      </Card>
    );

  return (
    <Card className="p-6 sm:p-8">
      <form
        noValidate
        onSubmit={handleSubmit(async (v) => {
          const res = await submitEnquiry({ name: v.name, email: v.email, topic: v.topic, message: v.message });
          setRef(res.reference);
        })}
        className="grid gap-5 sm:grid-cols-2"
      >
        <Field label="Name" autoComplete="name" error={e.name?.message} {...register("name")} />
        <Field label="Email" type="email" autoComplete="email" error={e.email?.message} {...register("email")} />
        <Field label="Organisation" optional autoComplete="organization" {...register("organisation")} />
        <Select label="Topic" error={e.topic?.message} {...register("topic")}>
          <option value="">Choose a topic</option>
          {Object.entries(TOPICS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink-900">
            Message
          </label>
          <textarea
            id="message"
            rows={5}
            aria-invalid={!!e.message}
            className="block w-full rounded-[var(--radius-control)] border-[1.5px] border-line-200 px-3.5 py-2.5 text-base text-ink-900 hover:border-brand-blue-500 focus:border-brand-blue-600 focus:ring-4 focus:ring-brand-blue-600/12 focus:outline-none"
            {...register("message")}
          />
          {e.message && <FieldError>{e.message.message}</FieldError>}
        </div>
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...register("website")} />
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500">
            We use these details only to reply to you. Protected by bot checks.
          </p>
          <Button type="submit" size="lg" loading={formState.isSubmitting}>
            Send message
          </Button>
        </div>
      </form>
    </Card>
  );
}
