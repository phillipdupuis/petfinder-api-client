import {
  PET_AGE_OPTIONS,
  PET_COAT_OPTIONS,
  PET_GENDER_OPTIONS,
  PET_SIZE_OPTIONS,
  PET_SORT_CRITERIA_OPTIONS,
  PET_STATUS_OPTIONS,
  PET_TYPE_OPTIONS,
} from "./constants";

export type PetAge = (typeof PET_AGE_OPTIONS)[number];
export type PetType = (typeof PET_TYPE_OPTIONS)[number];
export type PetCoat = (typeof PET_COAT_OPTIONS)[number];
export type PetGender = (typeof PET_GENDER_OPTIONS)[number];
export type PetSize = (typeof PET_SIZE_OPTIONS)[number];
export type PetSortCriteria = (typeof PET_SORT_CRITERIA_OPTIONS)[number];
export type PetStatus = (typeof PET_STATUS_OPTIONS)[number];

export type Link = {
  href: string;
};

export type PrevNextLinks = {
  previous: Link;
  next: Link;
};

export type Pagination = {
  count_per_page: number;
  total_count: number;
  current_page: number;
  total_pages: number;
  _links?: PrevNextLinks;
};

export type PetBreeds = {
  primary?: string;
  secondary?: string;
  mixed?: boolean;
  unknown?: boolean;
};

export type PetColors = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
};

export type PetAttributes = {
  spayed_neutered: boolean;
  house_trained: boolean;
  declawed?: boolean;
  special_needs: boolean;
  shots_current: boolean;
};

export type PetEnvironment = {
  children?: boolean;
  dogs?: boolean;
  cats?: boolean;
};

export type Photo = {
  small: string;
  medium: string;
  large: string;
  full: string;
};

export type Address = {
  address1?: string;
  address2?: string;
  city?: string;
  state: string;
  postcode: string;
  country: string;
};

export type Contact = {
  email?: string;
  phone?: string;
  address: Address;
};

export type PetLinks = {
  self: Link;
  type: Link;
  organization: Link;
};

export type Pet = {
  id: number;
  organization_id: string;
  url: string;
  type: string;
  species?: string;
  breeds: PetBreeds;
  colors: PetColors;
  age?: string;
  gender?: string;
  size?: string;
  coat?: string;
  attributes: PetAttributes;
  environment: PetEnvironment;
  tags: string[];
  name: string;
  description?: string;
  photos: Photo[];
  primary_photo_cropped?: Photo;
  status: string;
  published_at?: string;
  status_changed_at?: string;
  contact: Contact;
  _links: PetLinks;
};

export type PetQueryFilters = {
  type?: PetType;
  status?: PetStatus;
  age?: PetAge | PetAge[];
  size?: PetSize | PetSize[];
  gender?: PetGender | PetGender[];
  breed?: string | string[];
  coat?: PetCoat | PetCoat[];
  color?: string | string[];
  organization?: string | string[];
  location?: string;
  distance?: number;
  name?: string;
};

export type PetQueryResponseData = {
  animals: Pet[];
  pagination: Pagination;
};
