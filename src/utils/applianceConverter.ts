import { Appliance as UIAppliance } from "@/types/appliance";
import { Appliance as DBAppliance } from "@/types/database";

/**
 * Convierte un electrodoméstico de la base de datos al formato de la UI
 */
export function dbApplianceToUI(dbAppliance: DBAppliance): UIAppliance {
	return {
		id: dbAppliance.id,
		name: dbAppliance.name,
		powerWatts: dbAppliance.power_watts,
		hoursPerDay: dbAppliance.daily_hours,
		category: dbAppliance.category,
	};
}

/**
 * Convierte un electrodoméstico del formato de la UI al formato de la base de datos
 */
export function uiApplianceToDB(uiAppliance: Omit<UIAppliance, "id">): Omit<DBAppliance, "id" | "created_at" | "user_id"> {
	return {
		name: uiAppliance.name,
		category: uiAppliance.category,
		power_watts: uiAppliance.powerWatts,
		daily_hours: uiAppliance.hoursPerDay,
		quantity: 1, // Por defecto 1
	};
}

