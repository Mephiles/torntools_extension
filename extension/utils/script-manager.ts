import { getPage } from "@/utils/common/functions/torn";
import BankInvestmentInfoFeature from "@/features/bank-investment-info/bank-investment-info";
import BankInvestmentDueTimeFeature from "@/features/bank-investment-due-time/bank-investment-due-time";
import BarLinksFeature from "@/features/bar-links/bar-links";
import BazaarFillMaxFeature from "@/features/bazaar-fill-max/bazaar-fill-max";
import BazaarSubVendorItemsFeature from "@/features/bazaar-sub-vendor-items/bazaar-sub-vendor-items";
import BazaarWorthFeature from "@/features/bazaar-worth/bazaar-worth";
import BlackjackStrategyFeature from "@/features/blackjack-strategy/blackjack-strategy";
import BookEffectFeature from "@/features/book-effect/book-effect";
import BountyFilterFeature from "@/features/bounty-filter/bounty-filter";
import CanEnergyFeature from "@/features/can-energy/can-energy";
import CandyHappyFeature from "@/features/candy-happy/candy-happy";
import CarWinPercentageFeature from "@/features/car-win-percentage/car-win-percentage";
import CasinoNetTotalFeature from "@/features/casino-net-total/casino-net-total";
import ChatAutocompleteFeature from "@/features/chat-autocomplete/chat-autocomplete";
import ChatHighlightFeature from "@/features/chat-highlight/chat-highlight";
import CityItemsFeature from "@/features/city-items/city-items";
import CleanFlightFeature from "@/features/clean-flight/clean-flight";
import CollapsibleAreasFeature from "@/features/collapsible-areas/collapsible-areas";
import ColoredChatFeature from "@/features/colored-chat/colored-chat";
import CompanyAddictionFeature from "@/features/company-addiction/company-addiction";
import CompanyIDFeature from "@/features/company-id/company-id";
import CompanySpecialsFeature from "@/features/company-specials/company-specials";
import ComputerLinkFeature from "@/features/computer-link/computer-link";
import DisableAllyAttacksFeature from "@/features/disable-ally-attacks/disable-ally-attacks";
import DisplayCaseWorthFeature from "@/features/display-case-worth/display-case-worth";
import EasterEggFeature from "@/features/easter-egg/easter-egg";
import EducationFinishTimeFeature from "@/features/education-finish-time/education-finish-time";
import EffectiveStatsFeature from "@/features/effective-stats/effective-stats";
import EfficientRehabFeature from "@/features/efficient-rehab/efficient-rehab";
import AbroadPeopleFilterFeature from "@/features/abroad-people-filter/abroad-people-filter";
import AlignLeftFeature from "@/features/align-left/align-left";
import AutoStockFillFeature from "@/features/auto-stock-fill/auto-stock-fill";
import { runGlobalPageScripts } from "@/pages/global-page";
import { FEATURE_MANAGER } from "@/features/feature-manager";
import TravelTableFeature from "@/features/travel-table/travel-table";
import TravelSyncFeature from "@/features/travel-table/travel-table-sync";
import { setupTravelAbroadPage } from "@/pages/travel-abroad-page";
import "../utils/common/global/globalStyle.css";
import "../utils/common/global/globalVariables.css";
import "@vendor/phosphor-icons";
import { initializeDatabase } from "@/utils/common/data/database";
import { setupItemPage } from "@/pages/item-page";
import QuickItemsFeature from "@/features/quick-items/quick-items";
import CreatorsFeature from "@/features/creators/creators";
import { setupAuctionHousePage } from "@/pages/auction-house-page";
import { setupBountiesPage } from "@/pages/bounties-page";
import { setupCrimesV2Page } from "@/pages/crimes2-page";
import { setupCompanyPage } from "@/pages/company-page";
import { setupCrimesV1Page } from "@/pages/crimes1-page";
import { setupFactionsPage } from "@/pages/factions-page";
import { setupGymPage } from "@/pages/gym-page";
import { setupHospitalPage } from "@/pages/hospital-page";
import { setupItemMarketPage } from "@/pages/itemmarket-page";
import { setupJailPage } from "@/pages/jail-page";
import { setupMissionsPage } from "@/pages/missions-page";
import { setupTradePage } from "@/pages/trade-page";
import { setupTravelHomePage } from "@/pages/travel-home-page";
import { setupUserlistPage } from "@/pages/userlist-page";
import AbroadItemsFilterFeature from "@/features/abroad-items-filter/abroad-items-filter";
import AbroadEnergyWarningFeature from "@/features/abroad-energy-warning/abroad-energy-warning";
import AbroadAutoFillMaxFeature from "@/features/abroad-auto-fill-max/abroad-auto-fill-max";
import AgeToWordsFeature from "@/features/age-to-words/age-to-words";
import AddDebugInfoFeature from "@/features/add-debug-info/add-debug-info";
import AlcoholNerveFeature from "@/features/alcohol-nerve/alcohol-nerve";
import AttackTimeoutWarningFeature from "@/features/attack-timeout-warning/attack-timeout-warning";
import ArmoryWorthFeature from "@/features/armory-worth/armory-worth";
import CustomLinksFeature from "@/features/custom-links/custom-links";
import AchievementsFeature from "@/features/achievements/achievements";
import AveragePersonalStatFeature from "@/features/average-personal-stat/average-personal-stat";
import AuctionHouseFilterFeature from "@/features/auction-house-filter/auction-house-filter";
import CooldownEndTimesFeature from "@/features/cooldown-end-times/cooldown-end-times";
import CrimeValueFeature from "@/features/crime-value/crime-value";
import Crimes2BurglaryFilterFeature from "@/features/crimes2-burglary-filter/crimes2-burglary-filter";
import { getSearchParameters } from "@/utils/common/functions/dom";
import CSVChainReportFeature from "@/features/csv-chain-report/csv-chain-report";
import CSVChallengeContributionsFeature from "@/features/csv-challenge-contributions/csv-challenge-contributions";
import CSVRaidReportFeature from "@/features/csv-raid-report/csv-raid-report";
import CSVRankedWarReportFeature from "@/features/csv-ranked-war-report/csv-ranked-war-report";
import CSVWarReportFeature from "@/features/csv-war-report/csv-war-report";
import ArmoryFilterFeature from "@/features/armory-filter/armory-filter";
import DrugDetailsFeature from "@/features/drug-details/drug-details";
import DisableAllyAttacksLoaderFeature from "@/features/disable-ally-attacks/disable-ally-attacks-loader";
import EventWorthFeature from "@/features/event-worth/event-worth";
import EnemyFilterFeature from "@/features/enemy-filter/enemy-filter";
import EnergyWarningFeature from "@/features/energy-warning/energy-warning";
import EmployeeEffectivenessFeature from "@/features/employee-effectiveness/employee-effectiveness";
import FactionBankerFeature from "@/features/faction-banker/faction-banker";
import FactionIDFeature from "@/features/faction-id/faction-id";
import FactionMemberNumberFeature from "@/features/faction-member-number/faction-member-number";
import FairAttackFeature from "@/features/fair-attack/fair-attack";
import ChatFontSizeFeature from "@/features/chat-font-size/chat-font-size";
import FlyingTimeFeature from "@/features/flying-time/flying-time";
import FactionMemberFilterFeature from "@/features/faction-member-filter/faction-member-filter";
import FactionOCTimeFeature from "@/features/faction-oc-time/faction-oc-time";

export function scriptManager() {
	initializeDatabase();

	const page = getPage();

	/*
	 * Feature Management
	 */
	runGlobalPageScripts();
	FEATURE_MANAGER.registerFeature(new CustomLinksFeature());
	FEATURE_MANAGER.registerFeature(new BarLinksFeature());
	FEATURE_MANAGER.registerFeature(new CollapsibleAreasFeature());
	FEATURE_MANAGER.registerFeature(new ComputerLinkFeature());
	FEATURE_MANAGER.registerFeature(new AlignLeftFeature());
	FEATURE_MANAGER.registerFeature(new AchievementsFeature());
	FEATURE_MANAGER.registerFeature(new ChatAutocompleteFeature());
	FEATURE_MANAGER.registerFeature(new ChatHighlightFeature());
	FEATURE_MANAGER.registerFeature(new ColoredChatFeature());
	FEATURE_MANAGER.registerFeature(new CompanyAddictionFeature());
	FEATURE_MANAGER.registerFeature(new CooldownEndTimesFeature());
	FEATURE_MANAGER.registerFeature(new EasterEggFeature());
	FEATURE_MANAGER.registerFeature(new ChatFontSizeFeature());
	FEATURE_MANAGER.registerFeature(new FactionOCTimeFeature());

	if (page === "bank") {
		FEATURE_MANAGER.registerFeature(new BankInvestmentInfoFeature());
		FEATURE_MANAGER.registerFeature(new BankInvestmentDueTimeFeature());
	} else if (page === "profiles") {
		FEATURE_MANAGER.registerFeature(new DisableAllyAttacksFeature());
	} else if (page === "displaycase") {
		FEATURE_MANAGER.registerFeature(new DisplayCaseWorthFeature());
	} else if (page === "education") {
		FEATURE_MANAGER.registerFeature(new EducationFinishTimeFeature());
	} else if (page === "home") {
		FEATURE_MANAGER.registerFeature(new EffectiveStatsFeature());
	} else if (page === "travel") {
		setupTravelAbroadPage().then(() => {});
		setupTravelHomePage().then(() => {});
		FEATURE_MANAGER.registerFeature(new TravelTableFeature());
		FEATURE_MANAGER.registerFeature(new TravelSyncFeature());
		FEATURE_MANAGER.registerFeature(new AbroadItemsFilterFeature());
		FEATURE_MANAGER.registerFeature(new AbroadEnergyWarningFeature());
		FEATURE_MANAGER.registerFeature(new AbroadAutoFillMaxFeature());
		FEATURE_MANAGER.registerFeature(new AbroadPeopleFilterFeature());
		FEATURE_MANAGER.registerFeature(new CleanFlightFeature());
		FEATURE_MANAGER.registerFeature(new FlyingTimeFeature());
	} else if (page === "rehab") {
		FEATURE_MANAGER.registerFeature(new EfficientRehabFeature());
	} else if (page === "item") {
		setupItemPage();
		FEATURE_MANAGER.registerFeature(new QuickItemsFeature());
		FEATURE_MANAGER.registerFeature(new AlcoholNerveFeature());
		FEATURE_MANAGER.registerFeature(new BookEffectFeature());
		FEATURE_MANAGER.registerFeature(new CanEnergyFeature());
		FEATURE_MANAGER.registerFeature(new CandyHappyFeature());
		FEATURE_MANAGER.registerFeature(new EnergyWarningFeature());
	} else if (page === "auction") {
		setupAuctionHousePage().then(() => {});
		FEATURE_MANAGER.registerFeature(new AuctionHouseFilterFeature());
	} else if (page === "bazaar") {
		FEATURE_MANAGER.registerFeature(new BazaarFillMaxFeature());
		FEATURE_MANAGER.registerFeature(new BazaarSubVendorItemsFeature());
		FEATURE_MANAGER.registerFeature(new BazaarWorthFeature());
	} else if (page === "bounties") {
		setupBountiesPage().then(() => {});
		FEATURE_MANAGER.registerFeature(new BountyFilterFeature());
	} else if (page === "city") {
		FEATURE_MANAGER.registerFeature(new CityItemsFeature());
		// Placeholder
	} else if (page === "companies") {
		setupCompanyPage();
		FEATURE_MANAGER.registerFeature(new AutoStockFillFeature());
		FEATURE_MANAGER.registerFeature(new CompanyIDFeature());
		FEATURE_MANAGER.registerFeature(new CompanySpecialsFeature());
		FEATURE_MANAGER.registerFeature(new EmployeeEffectivenessFeature());
	} else if (page === "joblist") {
		setupCompanyPage();
		FEATURE_MANAGER.registerFeature(new CompanyIDFeature());
	} else if (page === "crimes-v1") {
		setupCrimesV1Page();
	} else if (page === "crimes-v2") {
		setupCrimesV2Page();
		FEATURE_MANAGER.registerFeature(new CrimeValueFeature());
		FEATURE_MANAGER.registerFeature(new Crimes2BurglaryFilterFeature());
	} else if (page === "factions") {
		setupFactionsPage().then(() => {});
		FEATURE_MANAGER.registerFeature(new ArmoryWorthFeature());
		FEATURE_MANAGER.registerFeature(new ArmoryFilterFeature());
		FEATURE_MANAGER.registerFeature(new CSVChallengeContributionsFeature());
		FEATURE_MANAGER.registerFeature(new FactionBankerFeature());
		FEATURE_MANAGER.registerFeature(new FactionIDFeature());
		FEATURE_MANAGER.registerFeature(new FactionMemberNumberFeature());
		FEATURE_MANAGER.registerFeature(new FactionMemberFilterFeature());
	} else if (page === "forums") {
		FEATURE_MANAGER.registerFeature(new AddDebugInfoFeature());
	} else if (page === "gym") {
		setupGymPage().then(() => {});
	} else if (page === "hospital") {
		setupHospitalPage();
	} else if (page === "itemmarket") {
		setupItemMarketPage().then(() => {});
	} else if (page === "jail") {
		setupJailPage();
	} else if (page === "missions") {
		setupMissionsPage();
	} else if (page === "events") {
		FEATURE_MANAGER.registerFeature(new EventWorthFeature());
	} else if (page === "enemies") {
		FEATURE_MANAGER.registerFeature(new EnemyFilterFeature());
	} else if (page === "trade") {
		setupTradePage();
	} else if (page === "userlist") {
		setupUserlistPage();
	} else if (page === "profiles") {
		FEATURE_MANAGER.registerFeature(new CreatorsFeature());
		FEATURE_MANAGER.registerFeature(new AgeToWordsFeature());
	} else if (page === "attack") {
		FEATURE_MANAGER.registerFeature(new AttackTimeoutWarningFeature());
		FEATURE_MANAGER.registerFeature(new DisableAllyAttacksLoaderFeature());
		FEATURE_MANAGER.registerFeature(new FairAttackFeature());
	} else if (page === "api") {
		// TODO - Handle API page features.
	} else if (page === "casino") {
		FEATURE_MANAGER.registerFeature(new BlackjackStrategyFeature());
	} else if (page === "personalstats") {
		FEATURE_MANAGER.registerFeature(new AveragePersonalStatFeature());
	} else if (page === "racing") {
		FEATURE_MANAGER.registerFeature(new CarWinPercentageFeature());
	} else if (page === "war") {
		const step = getSearchParameters().get("step");
		if (step === "chainreport") {
			FEATURE_MANAGER.registerFeature(new CSVChainReportFeature());
		} else if (step === "raidreport") {
			FEATURE_MANAGER.registerFeature(new CSVRaidReportFeature());
		} else if (step === "rankreport") {
			FEATURE_MANAGER.registerFeature(new CSVRankedWarReportFeature());
		} else if (step === "warreport") {
			FEATURE_MANAGER.registerFeature(new CSVWarReportFeature());
		}
	}

	if (isPageWithItems(page)) {
		FEATURE_MANAGER.registerFeature(new DrugDetailsFeature());
	}
	if (isCasinoStatisticsPage(page)) {
		FEATURE_MANAGER.registerFeature(new CasinoNetTotalFeature());
	}
}

function isCasinoStatisticsPage(page: string) {
	return [
		"slotsstats",
		"highlowstats",
		"roulettestatistics",
		"kenostatistics",
		"bookie",
		"russianroulettestatistics",
		"crapsstats",
		"holdemstats",
		"blackjackstatistics",
	].includes(page);
}

function isPageWithItems(page: string) {
	return ["bazaar", "displaycase", "factions", "itemmarket", "item", "travel"].includes(page);
}
