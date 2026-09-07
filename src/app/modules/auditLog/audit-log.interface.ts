export interface IGetAllAuditLogsParams {
	page: number;
	limit: number;
	search?: string;
	action?: string;
	entity?: string;
	sortBy: "createdAt";
	sortOrder: "asc" | "desc";
}
