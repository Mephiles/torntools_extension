import type {
	FactionV1CrimesResponse,
	TornV1PawnshopResponse,
	TornV1StatsResponse,
	UserV1AmmoResponse,
	UserV1BarsResponse,
	UserV1EducationResponse,
	UserV1NetworthResponse,
	UserV1PerksResponse,
} from "@utils/functions/api-v1.types";
import type {
	AttacksResponse,
	FactionBasicResponse,
	FactionRankedWarResponse,
	TimestampResponse,
	TornCalendarResponse,
	TornEducationResponse,
	TornHonorsResponse,
	TornItemsResponse,
	TornMedalsResponse,
	TornProperties,
	UserBattleStatsResponse,
	UserCalendarResponse,
	UserCooldownsResponse,
	UserEventsResponse,
	UserFactionResponse,
	UserHonorsResponse,
	UserIconPrivate,
	UserJobResponse,
	UserMedalsResponse,
	UserMeritsResponse,
	UserMissionsResponse,
	UserMoneyResponse,
	UserNewEventsResponse,
	UserNewMessagesResponse,
	UserNotificationsResponse,
	UserOrganizedCrimeResponse,
	UserPersonalStatsFull,
	UserProfileResponse,
	UserPropertiesResponse,
	UserRefillsResponse,
	UserSkillsResponse,
	UserStocksResponse,
	UserTravelResponse,
	UserVirusResponse,
	UserWeaponExpResponse,
	UserWorkStatsResponse,
} from "tornapi-typescript";

export type FetchedUserdata = UserProfileResponse &
	UserFactionResponse &
	UserJobResponse &
	TimestampResponse &
	UserNotificationsResponse &
	UserV1BarsResponse &
	UserCooldownsResponse &
	UserTravelResponse &
	UserNewMessagesResponse &
	UserRefillsResponse & { icons: UserIconPrivate[] } & UserMoneyResponse &
	UserStocksResponse &
	UserMeritsResponse &
	UserV1PerksResponse &
	UserV1NetworthResponse &
	UserV1AmmoResponse &
	UserBattleStatsResponse &
	UserWorkStatsResponse &
	UserSkillsResponse &
	UserWeaponExpResponse &
	UserPropertiesResponse &
	UserCalendarResponse &
	UserOrganizedCrimeResponse &
	UserPersonalStatsFull &
	UserHonorsResponse &
	UserMedalsResponse &
	UserMissionsResponse &
	UserV1EducationResponse &
	AttacksResponse &
	(UserEventsResponse | UserNewEventsResponse) &
	UserVirusResponse;

export type FetchedTorndata = TornEducationResponse &
	TornCalendarResponse &
	TornProperties &
	TornHonorsResponse &
	TornMedalsResponse &
	TornItemsResponse &
	TornV1PawnshopResponse &
	TornV1StatsResponse;

export type FetchedFactiondataBasic = FactionBasicResponse & FactionRankedWarResponse;
export type FetchedFactiondataWithAccess = FetchedFactiondataBasic & FactionV1CrimesResponse;
