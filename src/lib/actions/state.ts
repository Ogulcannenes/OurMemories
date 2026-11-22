/** Shape returned by every form action. Messages are already localised. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<string, string>>;
};

export const initialState: ActionState = {};
