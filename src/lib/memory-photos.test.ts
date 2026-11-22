import { describe, expect, it } from "vitest";
import { mergeEditedPhotos } from "./memory-photos";

describe("mergeEditedPhotos", () => {
  it("removes only photos the form showed and the user took out", () => {
    const r = mergeEditedPhotos(["a", "b"], ["a", "b"], ["b"]);
    expect(r.photos).toEqual(["b"]);
    expect(r.dropped).toEqual(["a"]);
  });

  it("keeps a photo the partner added while the form was open", () => {
    // Form opened with [a]; partner then saved [a, p]; this user submits [a, n].
    const r = mergeEditedPhotos(["a", "p"], ["a"], ["a", "n"]);
    expect(r.photos).toEqual(["a", "n", "p"]);
    expect(r.dropped).toEqual([]);
  });

  it("keeps a photo that had no signed URL when the form opened", () => {
    const r = mergeEditedPhotos(["a", "unsigned"], ["a"], ["a"]);
    expect(r.photos).toEqual(["a", "unsigned"]);
    expect(r.dropped).toEqual([]);
  });

  it("respects the submitted order", () => {
    const r = mergeEditedPhotos(["a", "b", "c"], ["a", "b", "c"], ["c", "a", "b"]);
    expect(r.photos).toEqual(["c", "a", "b"]);
    expect(r.dropped).toEqual([]);
  });

  it("a new memory (nothing stored) is just the submitted list", () => {
    expect(mergeEditedPhotos([], [], ["x"])).toEqual({ photos: ["x"], kept: [], dropped: [] });
  });
});
