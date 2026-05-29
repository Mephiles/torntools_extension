import { mount } from "svelte";
import "@svelte/app.css";
import Popup from "./Popup.svelte";

mount(Popup, { target: document.getElementById("app")! });
