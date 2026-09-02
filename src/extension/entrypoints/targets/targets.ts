import { findElement } from "@common/utils/functions/find-elements.ts";
import { mount } from "svelte";
import Targets from "./Targets.svelte";

mount(Targets, { target: findElement("#app") });
