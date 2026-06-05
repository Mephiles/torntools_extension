import { createProxyService } from "@webext-core/proxy-service";
import { BACKGROUND_SERVICE_KEY, SOURCE_SERVICE_KEY } from "./proxy-service-keys";

export const SOURCE_SERVICE = createProxyService(SOURCE_SERVICE_KEY);
export const BACKGROUND_SERVICE = createProxyService(BACKGROUND_SERVICE_KEY);
