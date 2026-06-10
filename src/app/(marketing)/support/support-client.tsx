"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type FormKind = "support" | "data_deletion";

/** Contact-support and data-deletion request forms (App Store compliance). */
export function SupportClient() {
  const [kind, setKind] = useState<FormKind>("support");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");

    const body =
      kind === "data_deletion"
        ? `DATA DELETION REQUEST\nAccount email: ${email.trim()}\n${message.trim() ? `Notes: ${message.trim()}` : "Delete my account and all associated data."}`
        : message.trim();

    if (!body) {
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: kind,
          message: body,
          email: email.trim(),
          route: "/support",
        }),
      });
      const json = (await res.json()) as { ok: boolean };
      setStatus(json.ok ? "sent" : "failed");
      if (json.ok) {
        setMessage("");
      }
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex rounded-xl bg-gray-50 p-1 mb-5">
        {(
          [
            { id: "support", label: "Contact support" },
            { id: "data_deletion", label: "Delete my data" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setKind(t.id);
              setStatus("idle");
            }}
            className={
              kind === t.id
                ? "flex-1 py-2 text-sm font-medium rounded-lg bg-white text-green-700 shadow-sm"
                : "flex-1 py-2 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-700"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {kind === "data_deletion" && (
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          We&apos;ll permanently delete your account, plants, photos, health reports, and
          all associated data within 30 days. Enter the email you signed up with.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 mb-1">
            Your email
          </label>
          <input
            id="support-email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="support-message" className="block text-sm font-medium text-gray-700 mb-1">
            {kind === "data_deletion" ? "Anything we should know? (optional)" : "How can we help?"}
          </label>
          <textarea
            id="support-message"
            rows={4}
            required={kind === "support"}
            placeholder={
              kind === "data_deletion"
                ? "Optional notes"
                : "Describe the problem or question"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
          />
        </div>

        {status === "sent" && (
          <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
            {kind === "data_deletion"
              ? "Deletion request received. We'll confirm by email and complete it within 30 days."
              : "Message sent — we'll get back to you by email."}
          </p>
        )}
        {status === "failed" && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
            Couldn&apos;t send right now. Please email support@plantpal.app instead.
          </p>
        )}

        <Button type="submit" loading={status === "sending"} disabled={status === "sent"}>
          {kind === "data_deletion" ? "Request deletion" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
