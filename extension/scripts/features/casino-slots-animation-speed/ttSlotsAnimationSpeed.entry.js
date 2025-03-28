"use strict";
(() => {
    featureManager.registerFeature(
        "Fast Slots Animation", 
        "casino", 
        isEnabled,
        init, 
        start, 
        cleanup, 
        {
			storage: ["settings.pages.casino.fastSlotsAnimations"],
		}, 
        requirements, 
        {}
    );

    function isEnabled() {
        return !!settings.pages.casino.fastSlotsAnimations;
    }

    function init() {
        $.ajaxSetup({
            dataFilter: ajaxFilter
        });
    }

    function start() {

    }

    function cleanup() {

    }

    function requirements() {
        return null;
    }

    function ajaxFilter(data) {
        if (!data) return data;
        if (!isEnabled()) return data;
        
        try {
            var tempData = JSON.parse(data);
            if (tempData?.barrelsAnimationSpeed) {
                tempData.barrelsAnimationSpeed = parseInt(tempData.barrelsAnimationSpeed / 10);
                data = JSON.stringify(tempData);
            }
        } catch {
            console.log('error parsing during AJAX dataFilter');
        }
        return data;
    }
})();