import { findElement } from "@common/utils/functions/find-elements.ts";
import TOS from "@extension/entrypoints/tos/TOS.svelte";
import { mount } from "svelte";

mount(TOS, { target: findElement("#app") });
