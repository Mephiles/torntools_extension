import { type SVGFactory, svgImport } from "@common/utils/svg-helper";
import PHBoldArrowBendUpLeftData from "@phosphor-icons/core/bold/arrow-bend-up-left-bold.svg";
import PHBoldArrowClockwiseData from "@phosphor-icons/core/bold/arrow-clockwise-bold.svg";
import PHBoldArrowDownData from "@phosphor-icons/core/bold/arrow-down-bold.svg";
import PHBoldArrowUpData from "@phosphor-icons/core/bold/arrow-up-bold.svg";
import PHBoldCheckData from "@phosphor-icons/core/bold/check-bold.svg";
import PHBoldCheckCircleData from "@phosphor-icons/core/bold/check-circle-bold.svg";
import PHBoldCopyData from "@phosphor-icons/core/bold/copy-bold.svg";
import PHBoldInfoData from "@phosphor-icons/core/bold/info-bold.svg";
import PHBoldSpinnerGapData from "@phosphor-icons/core/bold/spinner-gap-bold.svg";
import PHBoldWarningCircleData from "@phosphor-icons/core/bold/warning-circle-bold.svg";
import PHBoldXCircleData from "@phosphor-icons/core/bold/x-circle-bold.svg";
import PHFillAirplaneData from "@phosphor-icons/core/fill/airplane-fill.svg";
import PHFillArrowsOutCardinalData from "@phosphor-icons/core/fill/arrows-out-cardinal-fill.svg";
import PHFillBellData from "@phosphor-icons/core/fill/bell-fill.svg";
import PHFillBellSlashData from "@phosphor-icons/core/fill/bell-slash-fill.svg";
import PHFillCaretDownData from "@phosphor-icons/core/fill/caret-down-fill.svg";
import PHFillCaretRightData from "@phosphor-icons/core/fill/caret-right-fill.svg";
import PHFillCaretUpData from "@phosphor-icons/core/fill/caret-up-fill.svg";
import PHFillFunnelData from "@phosphor-icons/core/fill/funnel-fill.svg";
import PHFillFunnelXData from "@phosphor-icons/core/fill/funnel-x-fill.svg";
import PHFillGearData from "@phosphor-icons/core/fill/gear-fill.svg";
import PHFillInfoData from "@phosphor-icons/core/fill/info-fill.svg";
import PHFillPlusData from "@phosphor-icons/core/fill/plus-fill.svg";
import PHFillStethoscopeData from "@phosphor-icons/core/fill/stethoscope-fill.svg";
import PHFillTableData from "@phosphor-icons/core/fill/table-fill.svg";
import PHCaretDownData from "@phosphor-icons/core/regular/caret-down.svg";
import PHEyeData from "@phosphor-icons/core/regular/eye.svg";
import PHEyeSlashData from "@phosphor-icons/core/regular/eye-slash.svg";
import PHPlusData from "@phosphor-icons/core/regular/plus.svg";
import PHQuestionData from "@phosphor-icons/core/regular/question.svg";
import PHTrashData from "@phosphor-icons/core/regular/trash.svg";
import PHXData from "@phosphor-icons/core/regular/x.svg";
import PHXCircleData from "@phosphor-icons/core/regular/x-circle.svg";

const lazyImport = (svgData: string): SVGFactory => {
	let factory: SVGFactory | undefined;

	return (attributes) => {
		factory ??= svgImport(svgData);
		return factory(attributes);
	};
};

export const PHCaretDown = lazyImport(PHCaretDownData);
export const PHEye = lazyImport(PHEyeData);
export const PHEyeSlash = lazyImport(PHEyeSlashData);
export const PHPlus = lazyImport(PHPlusData);
export const PHTrash = lazyImport(PHTrashData);
export const PHQuestion = lazyImport(PHQuestionData);
export const PHX = lazyImport(PHXData);
export const PHXCircle = lazyImport(PHXCircleData);

export const PHBoldArrowBendUpLeft = lazyImport(PHBoldArrowBendUpLeftData);
export const PHBoldArrowClockwise = lazyImport(PHBoldArrowClockwiseData);
export const PHBoldArrowDown = lazyImport(PHBoldArrowDownData);
export const PHBoldArrowUp = lazyImport(PHBoldArrowUpData);
export const PHBoldCheck = lazyImport(PHBoldCheckData);
export const PHBoldCheckCircle = lazyImport(PHBoldCheckCircleData);
export const PHBoldCopy = lazyImport(PHBoldCopyData);
export const PHBoldInfo = lazyImport(PHBoldInfoData);
export const PHBoldWarningCircle = lazyImport(PHBoldWarningCircleData);
export const PHBoldXCircle = lazyImport(PHBoldXCircleData);
export const PHBoldSpinnerGap = lazyImport(PHBoldSpinnerGapData);

export const PHFillArrowsOutCardinal = lazyImport(PHFillArrowsOutCardinalData);
export const PHFillAirplane = lazyImport(PHFillAirplaneData);
export const PHFillBell = lazyImport(PHFillBellData);
export const PHFillBellSlash = lazyImport(PHFillBellSlashData);
export const PHFillCaretDown = lazyImport(PHFillCaretDownData);
export const PHFillCaretRight = lazyImport(PHFillCaretRightData);
export const PHFillCaretUp = lazyImport(PHFillCaretUpData);
export const PHFillInfo = lazyImport(PHFillInfoData);
export const PHFillFunnel = lazyImport(PHFillFunnelData);
export const PHFillFunnelX = lazyImport(PHFillFunnelXData);
export const PHFillGear = lazyImport(PHFillGearData);
export const PHFillPlus = lazyImport(PHFillPlusData);
export const PHFillStethoscope = lazyImport(PHFillStethoscopeData);
export const PHFillTable = lazyImport(PHFillTableData);
