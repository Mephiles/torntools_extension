import { findElement } from "@common/utils/functions/find-elements.ts";
import "@svelte/app.css";
import { mount } from "svelte";
import Popup from "./Popup.svelte";

mount(Popup, { target: findElement("#app") });
