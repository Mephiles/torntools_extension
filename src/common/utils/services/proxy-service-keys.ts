import type { BackgroundService } from "@extension/services/BackgroundService";
import type { SourceService } from "@extension/services/SourceService";
import type { ProxyServiceKey } from "@webext-core/proxy-service";

export const SOURCE_SERVICE_KEY = "source-service" as ProxyServiceKey<SourceService>;
export const BACKGROUND_SERVICE_KEY = "background-service" as ProxyServiceKey<BackgroundService>;
