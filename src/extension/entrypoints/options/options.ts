import { findElement } from "@common/utils/functions/find-elements.ts";
import { mount } from "svelte";
import Options from "./Options.svelte";

mount(Options, { target: findElement("#app") });
