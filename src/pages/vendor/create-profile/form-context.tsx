import { createContext, useContext, type ChangeEvent, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { FieldErrors, UseFormHandleSubmit, UseFormRegister, UseFormSetValue } from "react-hook-form";
import type { AirbnbReview, PriceTier, VendorProfileFormData } from "./schema";

export interface CreateProfileFormApi {
  navigate: (to: string | number) => void;
  user: { id: string } | null;
  isScraping: boolean;
  scrapedPhotos: string[];
  selectedPhotos: string[];
  menuFile: File | null;
  isUploadingMenu: boolean;
  menuUrl: string | null;
  includedItems: string[];
  newItem: string;
  setNewItem: Dispatch<SetStateAction<string>>;
  priceTiers: PriceTier[];
  newTierName: string;
  setNewTierName: Dispatch<SetStateAction<string>>;
  newTierPrice: string;
  setNewTierPrice: Dispatch<SetStateAction<string>>;
  isGeneratingDescription: boolean;
  airbnbUrl: string;
  setAirbnbUrl: Dispatch<SetStateAction<string>>;
  isScrapingAirbnb: boolean;
  airbnbReviews: AirbnbReview[];
  setAirbnbReviews: Dispatch<SetStateAction<AirbnbReview[]>>;
  hostBio: string;
  setHostBio: Dispatch<SetStateAction<string>>;
  hostAvatarUrl: string | null;
  setHostAvatarUrl: Dispatch<SetStateAction<string | null>>;
  setIsUploadingAvatar: Dispatch<SetStateAction<boolean>>;
  meetingPointDescription: string;
  setMeetingPointDescription: Dispatch<SetStateAction<string>>;
  isUploadingAvatar: boolean;
  ownershipEvidenceUrls: string[];
  setOwnershipEvidenceUrls: Dispatch<SetStateAction<string[]>>;
  isUploadingEvidence: boolean;
  isSubmitting: boolean;
  register: UseFormRegister<VendorProfileFormData>;
  handleSubmit: UseFormHandleSubmit<VendorProfileFormData>;
  setValue: UseFormSetValue<VendorProfileFormData>;
  errors: FieldErrors<VendorProfileFormData>;
  watchedValues: VendorProfileFormData;
  handleScrapeInstagram: () => void;
  togglePhotoSelection: (photo: string) => void;
  handleMenuUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  addIncludedItem: () => void;
  removeIncludedItem: (item: string) => void;
  addPriceTier: () => void;
  removePriceTier: (index: number) => void;
  updatePriceTier: (index: number, field: "name" | "price", value: string) => void;
  handleGenerateDescription: () => void;
  handleScrapeAirbnb: () => void;
  handleEvidenceUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (formData: VendorProfileFormData) => Promise<void> | void;
  isUpdateMode: boolean;
  CATEGORIES: readonly string[];
}

const CreateProfileContext = createContext<CreateProfileFormApi | null>(null);

export function CreateProfileProvider({
  value,
  children,
}: {
  value: CreateProfileFormApi;
  children: ReactNode;
}) {
  return <CreateProfileContext.Provider value={value}>{children}</CreateProfileContext.Provider>;
}

export function useCreateProfileForm() {
  const value = useContext(CreateProfileContext);
  if (!value) {
    throw new Error("CreateProfileForm must render inside CreateProfileProvider");
  }
  return value;
}
