import type { ProxyServiceKey } from "@webext-core/proxy-service";
import type { BackgroundService } from "@/utils/services/BackgroundService";
import type { SourceService } from "./SourceService";

export const SOURCE_SERVICE_KEY = "source-service" as ProxyServiceKey<SourceService>;
export const BACKGROUND_SERVICE_KEY = "background-service" as ProxyServiceKey<BackgroundService>;
