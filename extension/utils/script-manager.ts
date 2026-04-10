import { getPage } from "@/utils/common/functions/torn";
import BankInvestmentInfoFeature from "@/features/bank-investment-info/bank-investment-info";
import BankInvestmentDueTimeFeature from "@/features/bank-investment-due-time/bank-investment-due-time";
import BazaarFillMaxFeature from "@/features/fill-max/bazaar-fill-max";
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
import EasterEggsFeature from "@/features/easter-eggs/easter-eggs";
import EducationFinishTimeFeature from "@/features/education-finish-time/education-finish-time";
import EffectiveBattleStatsFeature from "@/features/effective-battle-stats/effective-battle-stats";
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
import AbroadAutoFillMaxFeature from "@/features/fill-max/abroad-auto-fill-max";
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
import FairAttackFeature from "@/features/fair-attack/fair-attack";
import ChatFontSizeFeature from "@/features/chat-font-size/chat-font-size";
import FlyingTimeFeature from "@/features/flying-time/flying-time";
import FactionMemberFilterFeature from "@/features/faction-member-filter/faction-member-filter";
import MemberInfoFeature from "@/features/member-info/member-info";
import FactionOCTimeFeature from "@/features/faction-oc-time/faction-oc-time";
import FactionStakeoutsFeature from "@/features/faction-stakeouts/faction-stakeouts";
import FactionQuickItemsFeature from "@/features/faction-quick-items/faction-quick-items";
import FoldFactionInfoboxFeature from "@/features/fold-faction-infobox/fold-faction-infobox";
import ForumMenuFeature from "@/features/forum-menu/forum-menu";
import ForumWarningFeature from "@/features/forum-warning/forum-warning";
import FriendFilterFeature from "@/features/friend-filter/friend-filter";
import FullFactionInfoboxFeature from "@/features/full-faction-infobox/full-faction-infobox";
import FriendlyFireFeature from "@/features/friendly-fire/friendly-fire";
import FFScouterGaugeFeature from "@/features/ff-scouter/ff-scouter-gauge";
import FFScouterMiniProfileFeature from "@/features/ff-scouter/ff-scouter-mini-profile";
import FFScouterAttackFeature from "@/features/ff-scouter/ff-scouter-attack";
import FFScouterFactionFeature from "@/features/ff-scouter/ff-scouter-faction";
import FFScouterProfileFeature from "@/features/ff-scouter/ff-scouter-profile";
import GreyCompletedCoursesFeature from "@/features/grey-completed-courses/grey-completed-courses";
import GymDisableStatsFeature from "@/features/gym-disable-stats/gym-disable-stats";
import GymGraphFeature from "@/features/gym-graph/gym-graph";
import GymProgressFeature from "@/features/gym-progress/gym-progress";
import GymSteadfastFeature from "@/features/gym-steadfast/gym-steadfast";
import HideAttackButtonsFeature from "@/features/hide-attack-buttons/hide-attack-buttons";
import HideCasinoGamesFeature from "@/features/hide-casino-games/hide-casino-games";
import HideChatFeature from "@/features/hide-chat/hide-chat";
import HideGymHighlightFeature from "@/features/hide-gym-highlight/hide-gym-highlight";
import HideIconsFeature from "@/features/hide-icons/hide-icons";
import HideLeaveButtonsFeature from "@/features/hide-leave-buttons/hide-leave-buttons";
import HideLevelUpgradeFeature from "@/features/hide-level-upgrade/hide-level-upgrade";
import HideNewspaperHighlightFeature from "@/features/hide-newspaper-highlight/hide-newspaper-highlight";
import HideRecycleMessageFeature from "@/features/hide-recycle-message/hide-recycle-message";
import HideStocksFeature from "@/features/hide-stocks/hide-stocks";
import ItemMarketFillMaxFeature from "@/features/fill-max/item-market-fill-max";
import ItemMarketLeftBarFeature from "@/features/item-market-left-bar/item-market-left-bar";
import JobSpecialsFeature from "@/features/job-specials/job-specials";
import JobPointsTooltipFeature from "@/features/jobpoints-tooltip/jobpoints-tooltip";
import LandingTimeFeature from "@/features/landing-time/landing-time";
import MarketIconsFeature from "@/features/market-icons/market-icons";
import MedicalLifeFeature from "@/features/medical-life/medical-life";
import MiniProfileLastActionFeature from "@/features/mini-profile-last-action/mini-profile-last-action";
import MissionRewardsFeature from "@/features/mission-rewards/mission-rewards";
import MuseumAutoFillFeature from "@/features/museum-auto-fill/museum-auto-fill";
import { MissingFlowersFeature, MissingPlushiesFeature } from "@/features/missing-sets/missing-sets";
import HideTooManyItemsWarningFeature from "@/features/hide-too-many-items-warning/hide-too-many-items-warning";
import HideTutorialsFeature from "@/features/hide-tutorials/hide-tutorials";
import HighlightBloodBagsFeature from "@/features/highlight-blood-bags/highlight-blood-bags";
import HighlightCheapItemsFeature from "@/features/highlight-cheap-items/highlight-cheap-items";
import HighlightEnergyRefillFeature from "@/features/highlight-energy-refill/highlight-energy-refill";
import HighlightNerveRefillFeature from "@/features/highlight-nerve-refill/highlight-nerve-refill";
import HighlightOCFeature from "@/features/highlight-oc/highlight-oc";
import HighlightPropertiesFeature from "@/features/highlight-properties/highlight-properties";
import HighLowHelperFeature from "@/features/high-low-helper/high-low-helper";
import HospitalFilterFeature from "@/features/hospital-filter/hospital-filter";
import MissionHintsFeature from "@/features/mission-hints/mission-hints";
import JailFilterFeature from "@/features/jail-filter/jail-filter";
import LiveNetworthFeature from "@/features/live-networth/live-networth";
import ItemValuesFeature from "@/features/item-values/item-values";
import LastActionFactionFeature from "@/features/last-action/last-action-faction";
import LastActionCompanyFeature from "@/features/last-action/last-action-company";
import CSVChallengeContributionsFeature from "@/features/csv-challenge-contributions/csv-challenge-contributions";
import FactionBankerFeature from "@/features/faction-banker/faction-banker";
import MemberRankFeature from "@/features/member-rank/member-rank";
import FactionIDFeature from "@/features/faction-id/faction-id";
import NoConfirmItemsFeature from "@/features/no-confirm/no-confirm-items";
import NoConfirmTradeFeature from "@/features/no-confirm/no-confirm-trade";
import NPCLootTimesFeature from "@/features/npc-loot-times/npc-loot-times";
import OCAvailablePlayersFeature from "@/features/oc-available-players/oc-available-players";
import OCLastActionFeature from "@/features/oc-last-action/oc-last-action";
import OpenOCFeature from "@/features/open-oc/open-oc";
import OpenedSupplyPackValueFeature from "@/features/opened-supply-pack-value/opened-supply-pack-value";
import NoConfirmPointsMarketFeature from "@/features/no-confirm/no-confirm-points-market";
import OCNNBFeature from "@/features/oc-nnb/oc-nnb";
import OCTimeFeature from "@/features/oc-time/oc-time";
import OCTimesFeature from "@/features/oc-times/oc-times";
import OC2FilterFeature from "@/features/oc2-filter/oc2-filter";
import OC2TimeFeature from "@/features/oc2-time/oc2-time";
import NoConfirmAbroadBuyFeature from "@/features/no-confirm/no-confirm-abroad-buy";
import PageTitleFeature from "@/features/page-title/page-title";
import PointsValueFeature from "@/features/points-value/points-value";
import ProfileIDFeature from "@/features/profile-id/profile-id";
import PropertyValuesFeature from "@/features/property-values/property-values";
import RWTimerFeature from "@/features/rw-timer/rw-timer";
import PreferenceSettingsFeature from "@/features/preference-settings/preference-settings";
import ProfileNotesFeature from "@/features/profile-notes/profile-notes";
import PropertyHappinessFeature from "@/features/property-happiness/property-happiness";
import QuickCrimesFeature from "@/features/quick-crimes/quick-crimes";
import RecommendedNNBFeature from "@/features/recommended-nnb/recommended-nnb";
import ReviveRequestFeature from "@/features/revive-request/revive-request";
import ProfileBoxFeature from "@/features/profile-box/profile-box";
import EmployeeInactivityWarningFeature from "@/features/employee-inactivity-warning/employee-inactivity-warning";
import MemberInactivityWarningFeature from "@/features/member-inactivity-warning/member-inactivity-warning";
import RacingFilterFeature from "@/features/racing-filter/racing-filter";
import RacingUpgradesFeature from "@/features/racing-upgrades/racing-upgrades";
import RankedWarFilterFeature from "@/features/ranked-war-filter/ranked-war-filter";
import SearchChatFeature from "@/features/search-chat/search-chat";
import SettingsLinkFeature from "@/features/settings-link/settings-link";
import ShopFiltersFeature from "@/features/shop-filters/shop-filters";
import ShopProfitsFeature from "@/features/shop-profits/shop-profits";
import ShopValuesFeature from "@/features/shop-values/shop-values";
import ShopsFillMaxFeature from "@/features/fill-max/shops-fill-max";
import ShowFactionSpyFeature from "@/features/show-faction-spy/show-faction-spy";
import SidebarNotesFeature from "@/features/sidebar-notes/sidebar-notes";
import SpecialistGymsFeature from "@/features/specialist-gyms/specialist-gyms";
import StocksFilterFeature from "@/features/stocks-filter/stocks-filter";
import StockAcronymsFeature from "@/features/stock-acronyms/stock-acronyms";
import StatusIndicatorFeature from "@/features/status-indicator/status-indicator";
import StackingModeFeature from "@/features/stacking-mode/stacking-mode";
import UpdateNoticeFeature from "@/features/update-notice/update-notice";
import VirusTimerFeature from "@/features/virus-timer/virus-timer";
import BarLinksFeature from "@/features/bar-links/bar-links";
import TravelCooldownsFeature from "@/features/travel-cooldowns/travel-cooldowns";
import TravelItemProfitsFeature from "@/features/travel-item-profits/travel-item-profits";
import TravelFillMaxFeature from "@/features/fill-max/travel-fill-max";
import UserlistFilterFeature from "@/features/userlist-filter/userlist-filter";
import WeaponExperienceFeature from "@/features/weapon-experience/weapon-experience";
import TargetFilterFeature from "@/features/target-filter/target-filter";
import TravelTabTitleTimerFeature from "@/features/travel-tab-title-timer/travel-tab-title-timer";
import TradeOpenChatFeature from "@/features/trade-open-chat/trade-open-chat";
import TradeValuesFeature from "@/features/trade-values/trade-values";
import TradeTimerFeature from "@/features/trade-timer/trade-timer";
import TotalPortfolioValueFeature from "@/features/total-portfolio-value/total-portfolio-value";
import TotalItemCostFeature from "@/features/total-item-cost/total-item-cost";
import UpgradeRequiredRespectFeature from "@/features/upgrade-required-respect/upgrade-required-respect";
import UserAliasChatFeature from "@/features/user-alias/user-alias-chat";
import UserAliasUserlistFeature from "@/features/user-alias/user-alias-userlist";
import UserAliasProfileFeature from "@/features/user-alias/user-alias-profile";
import WarFinishTimesFeature from "@/features/war-finish-times/war-finish-times";
import WarnCrimeFeature from "@/features/warn-crime/warn-crime";
import WeaponBonusInformationFeature from "@/features/weapon-bonus-information/weapon-bonus-information";
import StatsEstimateProfileFeature from "@/features/stats-estimate/stats-estimate-profile";
import StatsEstimateAbroadFeature from "@/features/stats-estimate/stats-estimate-abroad";
import StatsEstimateAttacksFeature from "@/features/stats-estimate/stats-estimate-attacks";
import StatsEstimateBountiesFeature from "@/features/stats-estimate/stats-estimate-bounties";
import StatsEstimateEnemiesFeature from "@/features/stats-estimate/stats-estimate-enemies";
import StatsEstimateFactionMembersFeature from "@/features/stats-estimate/stats-estimate-faction-members";
import StatsEstimateFactionRankedWarsFeature from "@/features/stats-estimate/stats-estimate-faction-ranked-wars";
import StatsEstimateFactionWarsFeature from "@/features/stats-estimate/stats-estimate-faction-wars";
import StatsEstimateHOFFeature from "@/features/stats-estimate/stats-estimate-hof";
import StatsEstimateTargetsFeature from "@/features/stats-estimate/stats-estimate-targets";
import StatsEstimateUserlistFeature from "@/features/stats-estimate/stats-estimate-userlist";
import StocksMoneyInputFeature from "@/features/stocks-money-input/stocks-money-input";
import ResizableChatFeature from "@/features/resizable-chat/resizable-chat";
import NoOutsideLinkAlertFeature from "@/features/no-outside-link-alert/no-outside-link-alert";
import RankedWarValueFeature from "@/features/ranked-war-value/ranked-war-value";
import OnlyNewFeedFeature from "@/features/only-new-feed/only-new-feed";

export function scriptManager() {
	initializeDatabase();

	const page = getPage();

	/*
	 * Feature Management
	 */
	runGlobalPageScripts();
	FEATURE_MANAGER.registerFeature(new PointsValueFeature());
	FEATURE_MANAGER.registerFeature(new RWTimerFeature());
	FEATURE_MANAGER.registerFeature(new ReviveRequestFeature());
	FEATURE_MANAGER.registerFeature(new CustomLinksFeature());
	FEATURE_MANAGER.registerFeature(new CollapsibleAreasFeature());
	FEATURE_MANAGER.registerFeature(new AlignLeftFeature());
	FEATURE_MANAGER.registerFeature(new HideLeaveButtonsFeature());
	FEATURE_MANAGER.registerFeature(new HideLevelUpgradeFeature());
	FEATURE_MANAGER.registerFeature(new HideTutorialsFeature());
	FEATURE_MANAGER.registerFeature(new HideChatFeature());
	FEATURE_MANAGER.registerFeature(new HideIconsFeature());
	FEATURE_MANAGER.registerFeature(new HideGymHighlightFeature());
	FEATURE_MANAGER.registerFeature(new HideNewspaperHighlightFeature());
	FEATURE_MANAGER.registerFeature(new HighlightEnergyRefillFeature());
	FEATURE_MANAGER.registerFeature(new HighlightNerveRefillFeature());
	FEATURE_MANAGER.registerFeature(new HighlightPropertiesFeature());
	FEATURE_MANAGER.registerFeature(new MiniProfileLastActionFeature());
	FEATURE_MANAGER.registerFeature(new JobPointsTooltipFeature());
	FEATURE_MANAGER.registerFeature(new AchievementsFeature());
	FEATURE_MANAGER.registerFeature(new ChatAutocompleteFeature());
	FEATURE_MANAGER.registerFeature(new ChatHighlightFeature());
	FEATURE_MANAGER.registerFeature(new ColoredChatFeature());
	FEATURE_MANAGER.registerFeature(new CompanyAddictionFeature());
	FEATURE_MANAGER.registerFeature(new CooldownEndTimesFeature());
	FEATURE_MANAGER.registerFeature(new EasterEggsFeature());
	FEATURE_MANAGER.registerFeature(new ChatFontSizeFeature());
	FEATURE_MANAGER.registerFeature(new FactionOCTimeFeature());
	FEATURE_MANAGER.registerFeature(new FFScouterGaugeFeature());
	FEATURE_MANAGER.registerFeature(new FFScouterMiniProfileFeature());
	FEATURE_MANAGER.registerFeature(new NPCLootTimesFeature());
	FEATURE_MANAGER.registerFeature(new OCTimeFeature());
	FEATURE_MANAGER.registerFeature(new OC2TimeFeature());
	FEATURE_MANAGER.registerFeature(new BarLinksFeature());
	FEATURE_MANAGER.registerFeature(new SearchChatFeature());
	FEATURE_MANAGER.registerFeature(new SettingsLinkFeature());
	FEATURE_MANAGER.registerFeature(new SidebarNotesFeature());
	FEATURE_MANAGER.registerFeature(new StackingModeFeature());
	FEATURE_MANAGER.registerFeature(new UpdateNoticeFeature());
	FEATURE_MANAGER.registerFeature(new VirusTimerFeature());
	FEATURE_MANAGER.registerFeature(new TradeTimerFeature());
	FEATURE_MANAGER.registerFeature(new UserAliasChatFeature());
	FEATURE_MANAGER.registerFeature(new ResizableChatFeature());
	FEATURE_MANAGER.registerFeature(new NoOutsideLinkAlertFeature());

	if (page === "bank") {
		FEATURE_MANAGER.registerFeature(new BankInvestmentInfoFeature());
		FEATURE_MANAGER.registerFeature(new BankInvestmentDueTimeFeature());
	} else if (page === "displaycase") {
		FEATURE_MANAGER.registerFeature(new DisplayCaseWorthFeature());
	} else if (page === "education") {
		FEATURE_MANAGER.registerFeature(new EducationFinishTimeFeature());
		FEATURE_MANAGER.registerFeature(new GreyCompletedCoursesFeature());
	} else if (page === "home") {
		FEATURE_MANAGER.registerFeature(new EffectiveBattleStatsFeature());
		FEATURE_MANAGER.registerFeature(new LiveNetworthFeature());
	} else if (page === "travel") {
		setupTravelAbroadPage().then(() => {});
		setupTravelHomePage().then(() => {});
		FEATURE_MANAGER.registerFeature(new TravelTableFeature());
		FEATURE_MANAGER.registerFeature(new TravelSyncFeature());
		FEATURE_MANAGER.registerFeature(new AbroadItemsFilterFeature());
		FEATURE_MANAGER.registerFeature(new AbroadEnergyWarningFeature());
		FEATURE_MANAGER.registerFeature(new AbroadAutoFillMaxFeature());
		FEATURE_MANAGER.registerFeature(new CleanFlightFeature());
		FEATURE_MANAGER.registerFeature(new FlyingTimeFeature());
		FEATURE_MANAGER.registerFeature(new LandingTimeFeature());
		FEATURE_MANAGER.registerFeature(new ComputerLinkFeature());
		FEATURE_MANAGER.registerFeature(new NoConfirmAbroadBuyFeature());
		FEATURE_MANAGER.registerFeature(new TravelCooldownsFeature());
		FEATURE_MANAGER.registerFeature(new TravelFillMaxFeature());
		FEATURE_MANAGER.registerFeature(new TravelItemProfitsFeature());
		FEATURE_MANAGER.registerFeature(new TravelTabTitleTimerFeature());
	} else if (page === "rehab") {
		FEATURE_MANAGER.registerFeature(new EfficientRehabFeature());
	} else if (page === "abroad-people") {
		FEATURE_MANAGER.registerFeature(new AbroadPeopleFilterFeature());
		FEATURE_MANAGER.registerFeature(new StatsEstimateAbroadFeature());
	} else if (page === "museum") {
		FEATURE_MANAGER.registerFeature(new MuseumAutoFillFeature());
	} else if (page === "item") {
		setupItemPage();
		FEATURE_MANAGER.registerFeature(new HideRecycleMessageFeature());
		FEATURE_MANAGER.registerFeature(new HideTooManyItemsWarningFeature());
		FEATURE_MANAGER.registerFeature(new HighlightBloodBagsFeature());
		FEATURE_MANAGER.registerFeature(new QuickItemsFeature());
		FEATURE_MANAGER.registerFeature(new NoConfirmItemsFeature());
		FEATURE_MANAGER.registerFeature(new OpenedSupplyPackValueFeature());
		FEATURE_MANAGER.registerFeature(new AlcoholNerveFeature());
		FEATURE_MANAGER.registerFeature(new BookEffectFeature());
		FEATURE_MANAGER.registerFeature(new CanEnergyFeature());
		FEATURE_MANAGER.registerFeature(new CandyHappyFeature());
		FEATURE_MANAGER.registerFeature(new EnergyWarningFeature());
		FEATURE_MANAGER.registerFeature(new MedicalLifeFeature());
		FEATURE_MANAGER.registerFeature(new MissingPlushiesFeature());
		FEATURE_MANAGER.registerFeature(new MissingFlowersFeature());
		FEATURE_MANAGER.registerFeature(new MarketIconsFeature());
	} else if (page === "auction") {
		setupAuctionHousePage().then(() => {});
		FEATURE_MANAGER.registerFeature(new AuctionHouseFilterFeature());
	} else if (page === "bazaar") {
		FEATURE_MANAGER.registerFeature(new BazaarFillMaxFeature());
		FEATURE_MANAGER.registerFeature(new BazaarSubVendorItemsFeature());
		FEATURE_MANAGER.registerFeature(new BazaarWorthFeature());
		FEATURE_MANAGER.registerFeature(new TotalItemCostFeature());
	} else if (page === "bounties") {
		setupBountiesPage().then(() => {});
		FEATURE_MANAGER.registerFeature(new StatsEstimateBountiesFeature());
		FEATURE_MANAGER.registerFeature(new BountyFilterFeature());
	} else if (page === "city") {
		FEATURE_MANAGER.registerFeature(new CityItemsFeature());
	} else if (page === "companies") {
		setupCompanyPage();
		FEATURE_MANAGER.registerFeature(new AutoStockFillFeature());
		FEATURE_MANAGER.registerFeature(new CompanyIDFeature());
		FEATURE_MANAGER.registerFeature(new CompanySpecialsFeature());
		FEATURE_MANAGER.registerFeature(new EmployeeEffectivenessFeature());
		FEATURE_MANAGER.registerFeature(new LastActionCompanyFeature());
		FEATURE_MANAGER.registerFeature(new EmployeeInactivityWarningFeature());
	} else if (page === "joblist") {
		setupCompanyPage();
		FEATURE_MANAGER.registerFeature(new CompanyIDFeature());
		FEATURE_MANAGER.registerFeature(new JobSpecialsFeature());
		FEATURE_MANAGER.registerFeature(new LastActionCompanyFeature());
		FEATURE_MANAGER.registerFeature(new EmployeeInactivityWarningFeature());
	} else if (page === "crimes-v1") {
		setupCrimesV1Page();
		FEATURE_MANAGER.registerFeature(new QuickCrimesFeature());
	} else if (page === "crimes-v2") {
		setupCrimesV2Page();
		FEATURE_MANAGER.registerFeature(new CrimeValueFeature());
		FEATURE_MANAGER.registerFeature(new Crimes2BurglaryFilterFeature());
	} else if (page === "factions") {
		setupFactionsPage().then(() => {});
		FEATURE_MANAGER.registerFeature(new AbroadEnergyWarningFeature());
		FEATURE_MANAGER.registerFeature(new EnergyWarningFeature());
		FEATURE_MANAGER.registerFeature(new MedicalLifeFeature());
		FEATURE_MANAGER.registerFeature(new ArmoryWorthFeature());
		FEATURE_MANAGER.registerFeature(new ArmoryFilterFeature());
		FEATURE_MANAGER.registerFeature(new HighlightBloodBagsFeature());
		FEATURE_MANAGER.registerFeature(new HighlightOCFeature());
		FEATURE_MANAGER.registerFeature(new FactionMemberFilterFeature());
		FEATURE_MANAGER.registerFeature(new MemberInfoFeature());
		FEATURE_MANAGER.registerFeature(new FactionStakeoutsFeature());
		FEATURE_MANAGER.registerFeature(new FactionQuickItemsFeature());
		FEATURE_MANAGER.registerFeature(new FoldFactionInfoboxFeature());
		FEATURE_MANAGER.registerFeature(new FactionBankerFeature());
		FEATURE_MANAGER.registerFeature(new FactionIDFeature());
		FEATURE_MANAGER.registerFeature(new CSVChallengeContributionsFeature());
		FEATURE_MANAGER.registerFeature(new MemberRankFeature());
		FEATURE_MANAGER.registerFeature(new FullFactionInfoboxFeature());
		FEATURE_MANAGER.registerFeature(new FFScouterFactionFeature());
		FEATURE_MANAGER.registerFeature(new LastActionFactionFeature());
		FEATURE_MANAGER.registerFeature(new OCAvailablePlayersFeature());
		FEATURE_MANAGER.registerFeature(new OCLastActionFeature());
		FEATURE_MANAGER.registerFeature(new OpenOCFeature());
		FEATURE_MANAGER.registerFeature(new OCNNBFeature());
		FEATURE_MANAGER.registerFeature(new OCTimesFeature());
		FEATURE_MANAGER.registerFeature(new OC2FilterFeature());
		FEATURE_MANAGER.registerFeature(new RecommendedNNBFeature());
		FEATURE_MANAGER.registerFeature(new MemberInactivityWarningFeature());
		FEATURE_MANAGER.registerFeature(new RankedWarFilterFeature());
		FEATURE_MANAGER.registerFeature(new StatsEstimateFactionMembersFeature());
		FEATURE_MANAGER.registerFeature(new StatsEstimateFactionRankedWarsFeature());
		FEATURE_MANAGER.registerFeature(new StatsEstimateFactionWarsFeature());
		FEATURE_MANAGER.registerFeature(new ShowFactionSpyFeature());
		FEATURE_MANAGER.registerFeature(new UpgradeRequiredRespectFeature());
		FEATURE_MANAGER.registerFeature(new UserAliasUserlistFeature());
		FEATURE_MANAGER.registerFeature(new WarFinishTimesFeature());
		FEATURE_MANAGER.registerFeature(new WarnCrimeFeature());
	} else if (page === "forums") {
		FEATURE_MANAGER.registerFeature(new AddDebugInfoFeature());
		FEATURE_MANAGER.registerFeature(new ForumMenuFeature());
		FEATURE_MANAGER.registerFeature(new ForumWarningFeature());
		FEATURE_MANAGER.registerFeature(new OnlyNewFeedFeature());
	} else if (page === "gym") {
		setupGymPage().then(() => {});
		FEATURE_MANAGER.registerFeature(new GymDisableStatsFeature());
		FEATURE_MANAGER.registerFeature(new GymGraphFeature());
		FEATURE_MANAGER.registerFeature(new GymProgressFeature());
		FEATURE_MANAGER.registerFeature(new GymSteadfastFeature());
		FEATURE_MANAGER.registerFeature(new SpecialistGymsFeature());
	} else if (page === "hospital") {
		setupHospitalPage();
		FEATURE_MANAGER.registerFeature(new HospitalFilterFeature());
		FEATURE_MANAGER.registerFeature(new UserAliasUserlistFeature());
	} else if (page === "itemmarket") {
		setupItemMarketPage().then(() => {});
		FEATURE_MANAGER.registerFeature(new HighlightCheapItemsFeature());
		FEATURE_MANAGER.registerFeature(new ItemMarketFillMaxFeature());
		FEATURE_MANAGER.registerFeature(new ItemMarketLeftBarFeature());
	} else if (page === "jail") {
		setupJailPage();
		FEATURE_MANAGER.registerFeature(new JailFilterFeature());
		FEATURE_MANAGER.registerFeature(new UserAliasUserlistFeature());
	} else if (page === "missions") {
		setupMissionsPage();
		FEATURE_MANAGER.registerFeature(new MissionHintsFeature());
		FEATURE_MANAGER.registerFeature(new MissionRewardsFeature());
	} else if (page === "events") {
		FEATURE_MANAGER.registerFeature(new EventWorthFeature());
	} else if (page === "enemies") {
		FEATURE_MANAGER.registerFeature(new StatsEstimateEnemiesFeature());
		FEATURE_MANAGER.registerFeature(new EnemyFilterFeature());
	} else if (page === "friends") {
		FEATURE_MANAGER.registerFeature(new FriendFilterFeature());
	} else if (page === "trade") {
		setupTradePage();
		FEATURE_MANAGER.registerFeature(new NoConfirmTradeFeature());
		FEATURE_MANAGER.registerFeature(new TradeOpenChatFeature());
		FEATURE_MANAGER.registerFeature(new TradeValuesFeature());
		FEATURE_MANAGER.registerFeature(new NoConfirmTradeFeature());
	} else if (page === "userlist") {
		setupUserlistPage();
		FEATURE_MANAGER.registerFeature(new UserlistFilterFeature());
		FEATURE_MANAGER.registerFeature(new StatsEstimateUserlistFeature());
		FEATURE_MANAGER.registerFeature(new UserAliasUserlistFeature());
	} else if (page === "profiles") {
		FEATURE_MANAGER.registerFeature(new StatsEstimateProfileFeature());
		FEATURE_MANAGER.registerFeature(new CreatorsFeature());
		FEATURE_MANAGER.registerFeature(new AgeToWordsFeature());
		FEATURE_MANAGER.registerFeature(new ProfileIDFeature());
		FEATURE_MANAGER.registerFeature(new ProfileNotesFeature());
		FEATURE_MANAGER.registerFeature(new FriendlyFireFeature());
		FEATURE_MANAGER.registerFeature(new DisableAllyAttacksFeature());
		FEATURE_MANAGER.registerFeature(new FFScouterProfileFeature());
		FEATURE_MANAGER.registerFeature(new ProfileBoxFeature());
		FEATURE_MANAGER.registerFeature(new StatusIndicatorFeature());
		FEATURE_MANAGER.registerFeature(new UserAliasProfileFeature());
	} else if (page === "attack") {
		FEATURE_MANAGER.registerFeature(new StatsEstimateAttacksFeature());
		FEATURE_MANAGER.registerFeature(new HideAttackButtonsFeature());
		FEATURE_MANAGER.registerFeature(new AttackTimeoutWarningFeature());
		FEATURE_MANAGER.registerFeature(new DisableAllyAttacksLoaderFeature());
		FEATURE_MANAGER.registerFeature(new FairAttackFeature());
		FEATURE_MANAGER.registerFeature(new FFScouterAttackFeature());
		FEATURE_MANAGER.registerFeature(new PageTitleFeature());
		FEATURE_MANAGER.registerFeature(new WeaponExperienceFeature());
	} else if (page === "attacklog") {
		FEATURE_MANAGER.registerFeature(new WeaponBonusInformationFeature());
	} else if (page === "casino") {
		FEATURE_MANAGER.registerFeature(new HideCasinoGamesFeature());
	} else if (page === "stocks") {
		FEATURE_MANAGER.registerFeature(new HideStocksFeature());
		FEATURE_MANAGER.registerFeature(new StockAcronymsFeature());
		FEATURE_MANAGER.registerFeature(new StocksFilterFeature());
		FEATURE_MANAGER.registerFeature(new TotalPortfolioValueFeature());
		FEATURE_MANAGER.registerFeature(new StocksMoneyInputFeature());
	} else if (page === "personalstats") {
		FEATURE_MANAGER.registerFeature(new AveragePersonalStatFeature());
	} else if (page === "racing") {
		FEATURE_MANAGER.registerFeature(new CarWinPercentageFeature());
		FEATURE_MANAGER.registerFeature(new RacingFilterFeature());
		FEATURE_MANAGER.registerFeature(new RacingUpgradesFeature());
	} else if (page === "war") {
		const step = getSearchParameters().get("step");
		if (step === "chainreport") {
			FEATURE_MANAGER.registerFeature(new CSVChainReportFeature());
		} else if (step === "raidreport") {
			FEATURE_MANAGER.registerFeature(new CSVRaidReportFeature());
		} else if (step === "rankreport") {
			FEATURE_MANAGER.registerFeature(new CSVRankedWarReportFeature());
			FEATURE_MANAGER.registerFeature(new RankedWarValueFeature());
		} else if (step === "warreport") {
			FEATURE_MANAGER.registerFeature(new CSVWarReportFeature());
		}
	} else if (page === "highlow") {
		FEATURE_MANAGER.registerFeature(new HighLowHelperFeature());
	} else if (page === "blackjack") {
		FEATURE_MANAGER.registerFeature(new BlackjackStrategyFeature());
	} else if (page === "points-market") {
		FEATURE_MANAGER.registerFeature(new NoConfirmPointsMarketFeature());
	} else if (page === "properties") {
		FEATURE_MANAGER.registerFeature(new PropertyValuesFeature());
		FEATURE_MANAGER.registerFeature(new PropertyHappinessFeature());
	} else if (page === "preferences") {
		FEATURE_MANAGER.registerFeature(new PreferenceSettingsFeature());
	} else if (page === "targets") {
		FEATURE_MANAGER.registerFeature(new StatsEstimateTargetsFeature());
		FEATURE_MANAGER.registerFeature(new TargetFilterFeature());
	} else if (page === "hof") {
		FEATURE_MANAGER.registerFeature(new StatsEstimateHOFFeature());
	}

	if (isPageWithDrugItems(page)) {
		FEATURE_MANAGER.registerFeature(new DrugDetailsFeature());
	}
	if (isPageWithItemValues(page)) {
		FEATURE_MANAGER.registerFeature(new ItemValuesFeature());
	}
	if (isCasinoStatisticsPage(page)) {
		FEATURE_MANAGER.registerFeature(new CasinoNetTotalFeature());
	}
	if (["shops", "bigalgunshop"].includes(page)) {
		FEATURE_MANAGER.registerFeature(new ShopFiltersFeature());
		FEATURE_MANAGER.registerFeature(new ShopProfitsFeature());
		FEATURE_MANAGER.registerFeature(new ShopValuesFeature());
		FEATURE_MANAGER.registerFeature(new ShopsFillMaxFeature());
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

function isPageWithDrugItems(page: string) {
	return ["bazaar", "displaycase", "factions", "itemmarket", "item", "travel"].includes(page);
}

function isPageWithItemValues(page: string) {
	return ["bazaar", "displaycase", "factions", "item", "itemuseparcel", "trade"].includes(page);
}
