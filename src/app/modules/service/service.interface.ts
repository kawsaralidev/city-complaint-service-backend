export interface IGetServicesParams {
  page: number;
  limit: number;
  search?: string;
  minFee?: number;
  maxFee?: number;
  sortOrder: "asc" | "desc";
}
