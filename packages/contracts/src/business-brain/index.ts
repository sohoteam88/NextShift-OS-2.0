import type { BusinessId, Result, TenantContext } from "@nextshift/shared";
import type { BusinessTwinSnapshot } from "../business-twin";
import type {
  ActivateBusinessTwinRequest,
  BrandDNAPayload,
  BusinessGoalsProfilePayload,
  BusinessProfileRecord,
  BusinessTwinActivationPayload,
  BusinessUnderstandingPayload,
  CreateBusinessProfileRequest,
  GenerateBusinessUnderstandingRequest,
  GetBrandProfileRequest,
  GetBusinessGoalsRequest,
  GetBusinessTwinStatusRequest,
  GetBusinessUnderstandingRequest,
  GetCustomerProfileRequest,
  GetOfferProfileRequest,
  GetBusinessProfileRequest,
  CustomerProfilePayload,
  OfferProfilePayload,
  UpdateBrandProfileRequest,
  UpdateBusinessGoalsRequest,
  UpdateCustomerProfileRequest,
  UpdateOfferProfileRequest,
} from "../business-profile";

export interface BusinessBrainContextRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly purpose: "understanding" | "recommendation" | "execution" | "learning";
}

export interface BusinessBrainContract {
  createBusinessProfile(
    request: CreateBusinessProfileRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getBusinessProfile(
    request: GetBusinessProfileRequest
  ): Promise<Result<BusinessProfileRecord | null>>;

  updateBrandProfile(
    request: UpdateBrandProfileRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getBrandProfile(
    request: GetBrandProfileRequest
  ): Promise<Result<BrandDNAPayload | null>>;

  updateOfferProfile(
    request: UpdateOfferProfileRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getOfferProfile(
    request: GetOfferProfileRequest
  ): Promise<Result<OfferProfilePayload | null>>;

  updateCustomerProfile(
    request: UpdateCustomerProfileRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getCustomerProfile(
    request: GetCustomerProfileRequest
  ): Promise<Result<CustomerProfilePayload | null>>;

  updateBusinessGoals(
    request: UpdateBusinessGoalsRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getBusinessGoals(
    request: GetBusinessGoalsRequest
  ): Promise<Result<BusinessGoalsProfilePayload | null>>;

  generateBusinessUnderstanding(
    request: GenerateBusinessUnderstandingRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getBusinessUnderstanding(
    request: GetBusinessUnderstandingRequest
  ): Promise<Result<BusinessUnderstandingPayload | null>>;

  activateBusinessTwin(
    request: ActivateBusinessTwinRequest
  ): Promise<Result<BusinessProfileRecord>>;

  getBusinessTwinStatus(
    request: GetBusinessTwinStatusRequest
  ): Promise<Result<BusinessTwinActivationPayload | null>>;

  getBusinessContext(
    request: BusinessBrainContextRequest
  ): Promise<Result<BusinessTwinSnapshot>>;
}
