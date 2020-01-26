export function scrollToTop(smoothe){
	if(smoothe){
		(function smoothscroll(){
		    var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
		    if(currentScroll > 0) {
		         window.requestAnimationFrame(smoothscroll);
		         window.scrollTo(0,currentScroll - (currentScroll/25));
		    }
		})();
	} else {
		window.scrollTo(0, 0);
	}
}