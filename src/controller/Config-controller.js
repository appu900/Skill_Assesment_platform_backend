import { StatusCodes } from "http-status-codes";
import ConfigService from "../service/ConfigService.js";
import asyncHandler from "../utils/asyncHandler.js";

const configService = new ConfigService();

const send = (res, data, message, status = StatusCodes.OK) => res.status(status).json({ success: true, data, message });

const getSettingKeys = asyncHandler(async (req, res) => send(res, configService.listKeys(), "settings fetched successfully"));

const getConfigs = asyncHandler(async (req, res) => send(res, await configService.list(req.query.key), "configuration fetched successfully"));

// ** the effective value for a context, e.g. ?key=fees&schemeType=Corporate&scheme=X&trainingPartnerId=Y
const resolveConfig = asyncHandler(async (req, res) => {
  const { key, schemeType, scheme, trainingPartnerId } = req.query;
  send(res, await configService.resolve(String(key), { schemeType, scheme, trainingPartnerId }), "configuration resolved successfully");
});

const saveConfig = asyncHandler(async (req, res) => send(res, await configService.save(req.body, req.user.id), "configuration saved successfully"));

const deleteConfig = asyncHandler(async (req, res) => send(res, await configService.remove(req.params.id), "configuration deleted successfully"));

export { getSettingKeys, getConfigs, resolveConfig, saveConfig, deleteConfig };
