import { vi } from "vitest";
import { chrome } from "vitest-chrome";

vi.stubGlobal("browser", chrome);
