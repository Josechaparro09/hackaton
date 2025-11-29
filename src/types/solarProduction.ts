export interface SolarProductionData {
	mes: string;
	departamento: string;
	produccion_mwh: number;
}

export type SortField = "mes" | "departamento" | "produccion_mwh";
export type SortOrder = "asc" | "desc";

