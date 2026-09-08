export interface IGetAllUsersParams {
	page: number;
	limit: number;
	search?: string;
	role?: "CITIZEN" | "OFFICER" | "ADMIN";
	status?: "ACTIVE" | "BLOCKED" | "DELETED";
	sortOrder: "asc" | "desc";
}

export interface IUpdateProfilePayload {
	name?: string;
}

export interface IProfileImage {
	buffer: Buffer;
	mimetype: string;
	originalname: string;
}
