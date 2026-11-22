/**
 * Which photos a memory ends up with after an edit, and which files to delete.
 *
 * A form may only remove photos it actually showed. Photos stored meanwhile (the partner added
 * one while this form was open) or that could not be displayed when the form opened (no signed
 * URL) are kept, after the submitted ones — a stale form never deletes what its user never saw.
 */
export function mergeEditedPhotos(previous: string[], shown: Iterable<string>, submitted: string[]) {
  const shownSet = new Set(shown);
  const kept = previous.filter((p) => !shownSet.has(p) && !submitted.includes(p));
  const photos = [...submitted, ...kept];
  const dropped = previous.filter((p) => !photos.includes(p));
  return { photos, kept, dropped };
}
