"use client";

import { startTransition, useActionState } from "react";
import { initialState, type ActionState } from "@/lib/actions/state";

/**
 * useActionState wired through onSubmit instead of `action={}`.
 * React resets uncontrolled forms after an `action` submission — which would wipe
 * what the user typed whenever validation fails. Submitting via a transition keeps it.
 */
export function useFormAction(action: (prev: ActionState, form: FormData) => Promise<ActionState>) {
  const [state, dispatch, pending] = useActionState(action, initialState);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(() => dispatch(form));
  };

  return { state, onSubmit, pending };
}
