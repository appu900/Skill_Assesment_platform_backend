import mongoose from "mongoose";
import ConfigRepository from "../repository/Config-repository.js";
import { getCacheConnection } from "../config/redis.js";
import SETTINGS, { SEEDED_SETTINGS, getSetting, settingKeys, validateSettingValue } from "../config/settings-registry.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

// ** redis layout: one hash per setting, "config:<key>", one field per scope (see targetOf) holding the JSON value.
// ** the LOADED field marks a hash as filled from mongodb, so a setting with no overrides is still a cache hit.
const cacheKey = (key) => `config:${key}`;
const LOADED = "__loaded";

// ** the redis field / unique id of a scope
const targetOf = ({ scope, schemeType, scheme, trainingPartnerId }) => {
  if (scope === "global") return "global";
  if (scope === "schemeType") return `schemeType:${schemeType}`;
  if (scope === "scheme") return `scheme:${scheme}`;
  return scheme ? `tp:${trainingPartnerId}|scheme:${scheme}` : `tp:${trainingPartnerId}`;
};

// ** lowest to highest priority for one batch / request context
const resolutionOrder = ({ schemeType, scheme, trainingPartnerId }) =>
  [
    "global",
    schemeType && `schemeType:${schemeType}`,
    scheme && `scheme:${scheme}`,
    trainingPartnerId && `tp:${trainingPartnerId}`,
    trainingPartnerId && scheme && `tp:${trainingPartnerId}|scheme:${scheme}`,
  ].filter(Boolean);

class ConfigService {
  constructor() {
    this.configRepository = new ConfigRepository();
  }

  // ** all overrides of a setting as { target: value }, from redis, filled from mongodb on a miss.
  // ** if redis is unavailable the settings are read straight from mongodb so operations keep working.
  async loadLayers(key) {
    const redis = getCacheConnection();
    try {
      const cached = await redis.hgetall(cacheKey(key));
      if (cached[LOADED]) {
        delete cached[LOADED];
        return Object.fromEntries(Object.entries(cached).map(([target, json]) => [target, JSON.parse(json)]));
      }
    } catch (error) {
      logger.warn(`config cache read failed for ${key}, using mongodb: ${error.message}`);
      return this.layersFromMongo(key);
    }
    return this.refreshCache(key);
  }

  async layersFromMongo(key) {
    const docs = await this.configRepository.findByKey(key);
    return Object.fromEntries(docs.map((doc) => [doc.target, doc.value]));
  }

  // ** rewrites the redis hash of a setting from mongodb (after every write, and on a cache miss)
  async refreshCache(key) {
    const layers = await this.layersFromMongo(key);
    try {
      const fields = { [LOADED]: "1" };
      for (const [target, value] of Object.entries(layers)) fields[target] = JSON.stringify(value);
      await getCacheConnection().multi().del(cacheKey(key)).hset(cacheKey(key), fields).exec();
    } catch (error) {
      logger.warn(`config cache write failed for ${key}: ${error.message}`);
    }
    return layers;
  }

  // ** the effective value of a setting for a context: default, then each matching override on top
  async resolve(key, context = {}) {
    const setting = getSetting(key);
    if (!setting) throw new AppError(`unknown setting "${key}"`);
    const layers = await this.loadLayers(key);
    const value = { ...setting.default };
    const appliedFrom = ["default"];
    for (const target of resolutionOrder(context)) {
      if (layers[target]) {
        Object.assign(value, layers[target]);
        appliedFrom.push(target);
      }
    }
    return { key, value, appliedFrom };
  }

  async get(key, context) {
    return (await this.resolve(key, context)).value;
  }

  listKeys() {
    return settingKeys().map((key) => ({ key, description: SETTINGS[key].description, default: SETTINGS[key].default, fields: SETTINGS[key].fields }));
  }

  async list(key) {
    return key ? this.configRepository.findByKey(key) : this.configRepository.findAll();
  }

  async save(payload, userId) {
    const { key, scope, value } = payload;
    if (!getSetting(key)) throw new AppError(`unknown setting "${key}"`);
    const errors = validateSettingValue(key, value);
    if (errors.length) throw new AppError(errors.join("; "));

    const doc = {
      key,
      scope,
      schemeType: null,
      scheme: null,
      trainingPartnerId: null,
      value,
      updatedBy: userId,
    };
    if (scope === "schemeType") {
      if (!payload.schemeType) throw new AppError("schemeType is required for this scope");
      doc.schemeType = String(payload.schemeType);
    } else if (scope === "scheme") {
      if (!payload.scheme) throw new AppError("scheme is required for this scope");
      doc.scheme = String(payload.scheme);
    } else if (scope === "trainingPartner") {
      if (!mongoose.isValidObjectId(payload.trainingPartnerId)) throw new AppError("a valid trainingPartnerId is required for this scope");
      doc.trainingPartnerId = String(payload.trainingPartnerId);
      doc.scheme = payload.scheme ? String(payload.scheme) : null; // ** optional: only for this scheme
    } else if (scope !== "global") {
      throw new AppError("scope must be global, schemeType, scheme or trainingPartner");
    }
    doc.target = targetOf(doc);

    const saved = await this.configRepository.upsert(doc);
    await this.refreshCache(key);
    return saved;
  }

  async remove(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError("invalid id");
    const deleted = await this.configRepository.deleteById(id);
    if (!deleted) throw AppError.notFound("setting not found");
    await this.refreshCache(deleted.key);
    return deleted;
  }

  // ** on startup: store the built-in overrides once, then load every setting into redis
  async warmUp() {
    // ** the cache connection rejects commands until it is connected, so give it a moment on startup
    const redis = getCacheConnection();
    if (redis.status !== "ready") {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 3000);
        redis.once("ready", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
    for (const seed of SEEDED_SETTINGS) {
      const doc = { schemeType: null, scheme: null, trainingPartnerId: null, ...seed };
      await this.configRepository.insertIfMissing({ ...doc, target: targetOf(doc), version: 1 });
    }
    for (const key of settingKeys()) await this.refreshCache(key);
    logger.info(`configuration loaded into redis (${settingKeys().join(", ")})`);
  }
}

export default ConfigService;
