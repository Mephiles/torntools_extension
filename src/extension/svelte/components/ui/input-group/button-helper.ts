import { tv } from "tailwind-variants";
import type { VariantProps } from "tailwind-variants";

export const inputGroupButtonVariants = tv({
	base: "gap-2 text-sm flex items-center shadow-none",
	variants: {
		size: {
			xs: "h-6 gap-1 rounded-[calc(var(--radius)_-_3px)] px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
			sm: "",
			"icon-xs": "size-6 rounded-[calc(var(--radius)_-_3px)] p-0 has-[>svg]:p-0",
			"icon-sm": "size-8 p-0 has-[>svg]:p-0",
		},
	},
	defaultVariants: {
		size: "xs",
	},
});

export type InputGroupButtonSize = VariantProps<typeof inputGroupButtonVariants>["size"];
