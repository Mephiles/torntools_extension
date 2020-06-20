export default {
    "v4.4": {
        "Features": [
            "Added percentages to Energy, Nerve, Happy, Life notifications",
            "Added Player Stats to Profile pages. To use, you need to have a TornStats account (https://www.tornstats.com/)",
            "Added Paypal donation button to Settings -> About page",
            "Added Fill Max button to Trave Market",
            "Added Gym Stats graph to Gym page. To use, you need to have a TornStats account ((https://www.tornstats.com/)"
        ],
        "Fixes": [
            "Disabled Chat Highlighting when Doctorn is installed and TornTools is not forced",
            "Disabled Quick Crimes & Quick Items if Doctorn is installed and TornTools is not forced",
            "Fixed Info popup showing only 0 messages & events"
        ],
        "Changes": [
            "Added nerve indicator to Quick Crimes",
            "Shop fill max takes into count the 100 item limit",
            "Shop & bazaar fill max take into count user's money",
            "Made Info popup bars a bit brigther and removed 'Status:' text",
            "Disabled simplified header for Info popup",
            "Added time of landing to Info popup travel bar",
            "Updated API info (Profile Stats makes 1 request to Torn's API and 1 to TornStats' API (max 25/minute))"
        ]
    },
    "v4.3.1": {
        "Fixes": [
            "Fixed Quick Crimes not appearing if user had 0 Quick Items",
            "Fixed Quick Items drag not working on Firefox"
        ]
    },
    "v4.3": {
        "Features": [
            "Added Notes section to Navigation bar",
            "Added Fill Max button to city shops & bazaars",
            "Added Player filters to Faction Info page, Jail page & Hospital page",
            "Added Country filter to Travel Destinations table & made legend collapsible",
            "Added Badge notifications for Events & Messages",
            "Added Chain cooldown timer to Info popup"
        ],
        "Fixes": [
            "Hopefully increased loading speeds for popups",
            "Fixed double notifications for some messages & events",
            "Fixed container collapse bubbling when loading site (changes are set before loading the container)",
            "Fixed Museum set message disappearing because of Upgrade button hide script",
            "Fixed ERROR badge flashing for some users",
            "Fixed Energy Estimate script on Gym page for users who have company special (+30% experience gain)",
            "Fixed Quick crimes",
            "Fixed People list breaking overseas because of the Item profits script",
            "Fixed Quick items not dragging well"
        ],
        "Changes": [
            "Simplified links design in popups to reduce clutter",
            "Separated Trade Item values & Total value to two different options to permanently disable item values",
            "Removed 'Location:' text from Info popup"
        ],
        "Thanks - RockyRoxanne [2282703]": [
            "Changed bar colors in Info popup",
            "Added option to Align Torn to left",
            "Added Happy reset timer to Info popup",
            "Improved design of Preferences page (slightly increased white space around sections and made container bigger)",
            "Added Messages section to Info popup",
            "Added links to Info popup messages & events",
            "Added Travel bar to Info popup"
        ]
    },
    "v4.2": {
        "Features": [
            "Added Info tab popup to display bars, money, events, cooldowns",
            "Added Estimated Energy progress to Gym (based on estimated goals in wiki and percentage to next gym on Gym page)",
            "Added notifications for new Events, Messages, Education finish, Cooldown end, Traveling, Bars full, Status change",
            "Added update-available notifier with instructions to manually update on About page",
            "Added option to hide Level Upgrade info (button and info on Home page)",
            "Added item type sorting to Travel Destinations table",
            "Added option to disable item highlighting on City Map if TornTools container is close (similar to Doctorn)",
            "Added option to open Custom Links on same page",
            "Added back Stock Search function",
            "Added option to hide item values on Trade view to allow copy-pasting for traders",
            "Added option to hide icons in navigation sidebar",
            "Added Quick items & crimes (might be a bit buggy, let me know)"
        ],
        "Fixes": [
            "Fixed ERROR text not disappearing after API comes back online",
            "Fixed Chat Highlight not updating when sending a message",
            "Fixed Armory log script not working when waited too long",
            "Improved load times of scripts",
            "Fixed Battle Stats NaN errors"
        ],
        "Changes": [
            "Changed Networth comparing to Torn's own last known networth (the one shown under General Information)",
            "Reformatted how Target List is updated. Removed the optional request.",
            "Changed Travel Destinations table columns order",
            "Removed 'remove info boxes' script completely"
        ],
        "IMPORTANT": [
            "Refactored how info is fetched from Torn. Total requests raised to 7 per minute to keep TornTools up-to-date with user's status, bars etc. for Info popup & notifications"
        ]
    },
    "v4.1": {
        "Fixes": [
            "Fixed bug that halted all extension's process",
            "Fixed Doctorn check not working correctly",
            "Fixed Mail Me link in settings - Thanks KenDoll[2235541]",
            "Fixed UAE travel achievement"
        ]
    },
    "v4.0 - Taking over": {
        "Features": [
            "Added option to force TornTools over Doctorn where possible",
            "Added custom Links to navigation panel",
            "Added Item Stock into Travel Destinations table (replaced flight time) - Powered by YATA",
            "Added option to collapse TornTools containers (clicking on the heading works too)",
            "Added option to show user's status indicator next to their name (page heading)",
            "Added Stocks price notifications (can set under stocks tab)",
            "Added an error badge to extension icon if API is down",
            "Added alerts for NPC loot times",
            "Added a button to clear target list data",
            "Added Chat Highlighting"
        ],
        "Fixes": [
            "IMPORTANT: Torn changed the formatting of dates in Vault transactions. Adjusted TornTools with that. (CLICK save to update the database with the latest correct date)",
            "Fixed Vault not updating User's shares when looping through old transactions",
            "Fixed API errors not appearing on Stocks page",
            "Fixed Doctorn always set as False on Firefox (set using/not using under settings)"
        ],
        "Changes": [
            "Removed Hospital from 'remove info boxes' script",
            "Simplified container headings (removed TornTools text)",
            "Further improved design of City Items",
            "Improved design of tables on Settings page (NPC Loot, Friendly Fire, Custom links)",
            "Improved design of Settings page in smaller windows",
            "Added current API key preview in Change API key input"
        ]
    },
    "v3.8.3": {
        "Fixes": [
            "Added confirmation message when changing your API key",
            "Fixed API online set to false when other API errors"
        ]
    },
    "v3.8.1": {
        "Fixes": [
            'Fixed "Remove info boxes on some pages" option not disabling'
        ]
    },
    "v3.8": {
        "Features": [
            "Added an Alternative Theme option (black background and green text)",
            "Added Disk Space Used info under About page (Chrome only)",
            "Added Date and Time formatting options (Added formatting to: Networth details)",
            "Added option to Remove Info Boxes that are unnecessary on some pages",
            "Added 'last updated' info icon for live Networth on Home page"
        ],
        "Fixes": [
            "Hopefully fixed sometimes appearing slow popup window switch",
            "Fixed Trade Calculator showing incorrect total value",
            "Fixed Allies not saving"
        ],
        "Changes": [
            "Removed some duplicated achievements (Items: Bazaar Customers, Points sold (both under Home page now))",
            "Moved Stock Payouts achievement to Home page (previously under Items)",
            "Changed Preferences' section positions",
            "Improved the design of City Items (hovering on an item in the list now reveals it on the map also)",
            "Updated icons (Settings, Portfolio, Search icon)"
        ],
        "Credits and Thanks to Lugburz [2386297]": [
            "Added NPC loot times",
            "Added OC finish times",
            "Added Faction Armory simplification",
            "Licensed my extension under the GNU General Public License"
        ]
    },
    "v3.7": {
        "Features": [
            "Added a Travel Destinations table to Travel Agency page",
            "Accidentally added features in last update: Effective Battle Stats on Home page, Item profits in Travel Market, Item values on Items page",
            "Added option to reformat Profile headings as USERNAME [ID]",
            "Added option to Export Chain Report as CSV"
        ],
        "Fixes": [
            "Added options for settings: Effective Battle Stats, Item profits in Travel Market, Item values on Items page",
            "Fixed issue where Accessory pictures were blocking vision of HiLo suggested action (I prevented any items from appearing on screen)",
            "Fixed disabling Gym buttons as clicking them still used energy before",
            "Fixed issue where disabling/enabling Gym buttons would clear preferences",
            "Fixed issue where Effective Battle Stats would show NaN",
            "Fixed Live Networth not showing if there are no details to show",
            "Fixed HiLo multiple suggestions appearing"
        ],
        "Changes": [
            "Improved design of Settings page",
            "Changed the structure of Local Database (You might need to check your settings)",
            "Reduced API requests needed by 1",
            "Improved popups' designs"
        ]
    },
    "v3.6.1": {
        "Features": [
            "Added new logo",
            "Added Target List to Settings page",
            "Added Blackjack and HiLo helpers to Casino",
            "Added option to disable update notifications",
            "Added option to disable Gym train buttons",
            "Added attack history info about user on Profile page",
            "Added percentage profit of items in stores (ie. 137% means that the market value is 137% of the store buy price)",
            "Added info tooltips for achievements",
            "Added detailed networth information on Home page",
            "Added bounty reward (money) achievement"
        ],
        "Fixes": [
            "Fixed some broken achievements (Home: activity, networth; Items: items dumped, cannabis; Missions: defends, assists)",
            "Hide empty Awards sections"
        ],
        "Changes": [
            "Improved Achievements' design",
            "Improved Missions Reward design",
            "Improved TornTools info containers",
            "Highlight new settings on Settings page",
            "Reset settings button resets extension's whole storage (except the API key)",
            "Shortened '1000' to 'k'"
        ]
    },
    "v3.5": {
        "Features": [
            "Create and update a target list based on attack history. (not available for use yet; coming with next update)",
            "Moved City & Dump finds achievements to city.php",
            "Moved items bought abroad achievement to travelagency.php",
            "Added Church donations achievement to church.php",
            "Increase 'time ago' counter on achievement pages."
        ],
        "Fixes": [
            "Fixed settings reseting when closing and re-opening browser.",
            "Fixed bug where Gym stats had a random comma after the decimal point. (all stats rounded down to a whole number)",
            "Fixed double update notification on profile.php on Firefox",
            "Fixed networth not showing for some users on home.php"
        ]
    },
    "v3.4": {
        "Features": [
            "Added Fraud crimes to Crime achievements.",
            "Added Github link to the extension (at the bottom of the Settings page)."
        ]
    },
    "v3.3": {
        "Features": [
            "Added more achievements on pages Home, Items, Missions, Jail, My Faction.",
            "Added Racing achievements.",
            "Fixed Racing Upgrades not showing correct values.",
            "Re-added notification when a new version of TornTools is installed."
        ]
    },
    "v3.2": {
        "Features": [
            "Show warning on player profiles when the player is in your faction or in an ally faction.",
            "Show racing upgrade values."
        ]
    },
    "v3.1": {
        "Fixes": [
            "Fixed the extension not updating after an API outage."
        ]
    },
    "v3 - Long time, no see(?)": {
        "Features": [
            "I removed some features either because they were not needed anymore (Torn has them default) or they weren't worth it. (auction, bazaar, forums, mail, profile voting) Let me know of any thoughts or ideas about these.",
            "Changed the system for saving settings so don't forget to press the Save button."
        ],
        "Fixes": [
            "Fixed long numbers on achievements (shortened to mil)",
            "Fixed wrong prices in Market",
            "Fixed Missions prices not appearing if the prices were split into 2 groups",
            "Fixed API page not working properly (the API key was inserted as 'unknown')",
            "Updated API request info"
        ]
    }
}

//,
    // "v2.1 - clean-up": {
    //     "Fixes": [
    //         "Fixed Awards not showing up (reworked whole achievement display code - let me know of any bugs)",
    //         "Fixed wrong API errors"
    //     ]
    // },
    // "v2.0 - The next big V huh..": {
    //     "Fixes": [
    //         "Fixed stock long unrounded numbers.",
    //         "Fixed tabs not showing error when API was down (hopefully?)"
    //     ],
    //     "Build": [
    //         "Refactored the extension so it is easier to develop. And easier to deploy on FireFox also.",
    //         "I bundled up all files into one right now. Which means a 1 bigger file is loaded on every site. Let me know of any performance issues or anything - I'll make it smaller if needed (probably even if not needed - YOUR FEEDBACK COUNTS)"
    //     ],
    //     "PS.": [
    //         "I understand there are some features that are quite buggy (not to name any names but.. *cough* bazaar helper, faction chats .. *cough*). I'll try to work on those :)",
    //         "Some features might have broken down during the changes I made. Let me know of any features that don't work at all or work incorrectly.",
    //         "PS. I was on holiday for a bit but I'm back now, so code.. here I come.."
    //     ]
    // },
    // "v1.9": {
    //     "New Features": [
    //         "City Find - shows items in city view and also the total price (Item List is hidden when using DocTorn - total price is still shown) - (Thanks Tos :))",
    //         "Added a few new achievements. (missions - total hits, largest mug, slashing hits)",
    //         "Multiple channels for Faction chat - disabled by default (learn more about it below - under Settings)",
    //         "Awards sections now show last fetch time",
    //         "Implemented API system fail check - data is not overwritten with errors anymore.",
    //         "There is now an option to Vote a player (commend or report - upvote/downvote) once in total. The stats are kept on my server. (No other information is sent to my server other than the User's name whose page you are visiting). This system will make it easier to recognize scammers and also trusted people.",
    //         "Also I set up a system where you can get user IDs via their name (not available this way on API yet) and to fill that database quicker when you visit a user's profile TornTools sends that users info to my server (again no other information is send than just the user's name and id)",
    //         "Any complaints or questions about sending info to my server - please let me know! (If you understand code and want to check for yourself then all 'POST' requests are done in background.js file)"
    //     ],
    //     "Fixes": [
    //         "Fixed issue where TornTools area wasn't shown anywhere else than desktop PCs.",
    //         "Made forum boxes smaller a bit.",
    //         "Fixed '/undefined' in mission achievements (killstreak)",
    //         "Removed achievement for 'Energy cans taken' as it was showing false info. Will add back when API shows stats for it."
    //     ],
    //     "Extras": [
    //         "When going to api.torn.com then the api key field is automatically filled with user's api key.",
    //         "When You find that api shows stats for some achievement that I have not displayed then please let me know :)",
    //         "Also added code to github if anyone is interested - https://github.com/Mephiles/tornTools"
    //     ]
    // },
    // "v1.8": {
    //     "New Features": [
    //         "Added option to make Mail text box bigger. (both when composing and replying to a mail)",
    //         "Added option to notify of Vicodin in bazaars that are priced over 100k. (I think you know why ;), price might be changed if for some reason Vicodin gets more expensive in the future)",
    //         "Bazaar helper now also shows the lowest price on market when managing items in your bazaar. (On both occasions look for the green checkmark - in case you don't see it or see a red cross: a reload might help. If not then check your settings. If still not then let me know!)",
    //         "As suggested by a user - a sub-tab is added to Stocks where you can add different stocks (permanently until removed) and see their benefits (and stock amounts needed/already owned)."
    //     ],
    //     "Fixes": [
    //         "TornTools link is now only shown under Areas when an update is installed. Settings can still be accessed by the 'wheel' when opening extension window.",
    //         "Added back info about API requests - be sure to see what will make one!"
    //     ],
    //     "API REQUEST - IMPORTANT": [
    //         "--GREATLY REDUCED API REQUEST AMOUNTS--",
    //         "Trade Calculator makes no requests anymore.",
    //         "Mission values makes no requests anymore.",
    //         "Networth on Home site makes no requests anymore.",
    //         "LEARN MORE FROM API REQUEST INFO DOWN BELOW"
    //     ],
    //     "Extras": [
    //         "I do NOT encourage signing up on my site yet as it is still 'under construction' and databases might be dropped quite frequently (meaning your user info will be lost). I will notify of future developments.",
    //         "Also any ideas are welcome (or if you want something personal made for you on my site?).",
    //         "Also also.. As you might have noticed - my 'designing' skills aren't the best (I'm okay with what I have right now but everything can be improved, right?) so hit me up if You want to help out, site design, logos, banners etc."
    //     ]
    // },
    // "v1.7.1": {
    //     "New Features": [
    //         "Added some functions for forum pages: 1) Added button that will take you to the top of the page. 2) Increased input box size.",
    //         "Added option to automatically scroll to the top of forum threads when going to one. (not ideal but works)",
    //         "Added option to show actual networth (fetched from API - 1-2min delay) on Home page.",
    //         "Added reset settings button.",
    //         "Added an area for Torn Tools under Areas - directs to this page. (also notifies of a new version release)",
    //         "Added indicator if the Bazaar Helper is working as it sometimes fails to load correctly (in case of failure - reloading the page should help)",
    //         "Please note that when you start adding items to bazaar but you are not on the main tab where all items are present then only the items on the opened tab will be 'watched'. When this occurs just click on 'all items' and refresh the page."
    //     ],
    //     "Fixes": [
    //         "Fixed wrong price info on auctions.",
    //         "Noticed that the same info was shown for Market and Bazaar (prices & quantities) in Market tab. Fixed that."
    //     ],
    //     "IMPORTANT": [
    //         "Please note that I removed API limit on trades (temporarily). It will be re-enabled once I figure out some code bugs etc."
    //     ],
    //     "Extras": [
    //         "Removed info about API requests amount. (Might add it back with more detailed info in later updates.)",
    //         "If any users had problem with setting the API key (nothing seemed to happen) - hopefully that is fixed now.",
    //         "Sorry if that update took a long time: reworked some code into parts so it is easier to add future features. Also holidays.. so.. :)",
    //         "Also working on making a site for TornTools for databases etc. Also for personal education as this is my first :) - www.torntools.eu"
    //     ]
    // },
    // "v1.6.2": [
    //     "Re-enabled bazaar price helper (available from settings - disabled by default to not cause any confusion) !!! Note that it only shows the price as a placeholder and You have to insert the price yourself."
    // ],
    // "v1.6.1": [
    //     "Added a colored bar that shows if you can afford a mission reward or not."
    // ],
    // "v1.6": [
    //     "Added option to show mission reward values. (especially useful - one point value)",
    //     "Searchbars on Market and Calculator tabs auto-focus when opened."
    // ],
    // "v1.5.1": [
    //     "Temporarily disabled Bazaar Helper as there is a bug with pricing. Patch coming soon!"
    // ],
    // "v1.5": [
    //     "Added bazaar price helper - auto complete prices (lowest on market)",
    //     "Added auction helper - show your own auctions all together",
    //     "Technical: reworked settings section of the extension"
    // ],
    // "v1.4": [
    //     "Fixed bug where trade values where not displayed in case of 0 items",
    //     "Added changelog",
    //     "Removed help section from settings",
    //     "Reduced api request amount in trade view. Set api limit to 60 requests on trade view."
    // ]