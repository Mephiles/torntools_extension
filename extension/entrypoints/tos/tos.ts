import { mount } from "svelte";
import TOS from "@/entrypoints/tos/TOS.svelte";

mount(TOS, { target: document.getElementById("app")! });
