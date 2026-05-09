"use client";

import { useActionState, useState } from "react";
import { updateDisplayName } from "@/app/me/actions";

type FormResult = { ok?: boolean; error?: string };

async function action(
  _prev: FormResult | null,
  formData: FormData,
): Promise<FormResult> {
  return await updateDisplayName(formData);
}

export function DisplayNameForm({ initial }: { initial: string | null }) {
  const [editing, setEditing] = useState(initial === null);
  const [result, dispatch, pending] = useActionState(action, null);

  if (!editing && initial !== null && !result?.error) {
    return (
      <div className="border-rule/60 flex items-center justify-between rounded-md border bg-white px-4 py-3">
        <div>
          <p className="text-ink-soft text-xs tracking-wide uppercase">
            Your name on the site
          </p>
          <p className="mt-0.5">{initial}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-ink-soft hover:text-ink text-sm transition-colors"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form
      action={dispatch}
      className="border-rule/60 rounded-md border bg-white p-4"
    >
      <label className="text-ink-soft block text-xs tracking-wide uppercase">
        Your name on the site
      </label>
      {initial === null && (
        <p className="text-ink-soft mt-1 text-sm leading-relaxed">
          This is what we&apos;ll show next to your contributions.
        </p>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          name="displayName"
          defaultValue={initial ?? ""}
          autoFocus={initial === null}
          maxLength={60}
          required
          placeholder="What should we call you?"
          className="border-rule focus:border-sage flex-1 rounded-md border px-3 py-2 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-sage hover:bg-sage/90 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {result?.error && (
        <p className="mt-2 text-sm text-red-700">{result.error}</p>
      )}
      {result?.ok && (
        <p className="text-ink-soft mt-2 text-sm">Saved.</p>
      )}
    </form>
  );
}
