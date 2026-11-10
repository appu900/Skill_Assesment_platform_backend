import ConfigService from "../../service/ConfigService.js";

const configService = new ConfigService();

// ** RailTel ToA programme settings for a training partner (global values + that partner's overrides)
export const toaSettings = (toaTpId) => configService.get("toaProgramme", { trainingPartnerId: toaTpId ? String(toaTpId) : undefined });
