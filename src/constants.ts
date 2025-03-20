export const PET_AGE_OPTIONS = ["baby", "young", "adult", "senior"] as const;

export const PET_TYPE_OPTIONS = [
  "dog",
  "cat",
  "small-furry",
  "bird",
  "scales-fins-other",
  "barnyard",
  "rabbit",
  "horse",
] as const;

export const PET_COAT_OPTIONS = [
  "short",
  "medium",
  "long",
  "wire",
  "hairless",
  "curly",
] as const;

export const PET_GENDER_OPTIONS = ["male", "female", "unknown"] as const;

export const PET_SIZE_OPTIONS = [
  "small",
  "medium",
  "large",
  "extra-large",
] as const;

export const PET_SORT_CRITERIA_OPTIONS = [
  "recent",
  "random",
  "distance",
  "-recent",
  "-distance",
] as const;

export const PET_STATUS_OPTIONS = ["adoptable", "adopted", "found"] as const;
