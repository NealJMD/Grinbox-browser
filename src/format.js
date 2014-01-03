var colorings;
var options;
var interval;

chrome.extension.sendMessage({get_options: true, get_colorings: true}, function(response) {
	useData(response.colorings);
	options = response.options || {};
});

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
	console.log("got request from bg");
	console.log(request);
	useData(request);
});

function useData(r){
	colorings = r
	applyStyles();
	clearInterval(interval);
	interval = window.setInterval(applyStyles, 10000);
}


function applyStyles(){
	console.log("apply the styles!");
	console.log(colorings);
    $.each(colorings, function(subject, color){
    	var a = $('span:contains("'+subject+'")');
    	var b = a.parents('tr');
        b.css('cssText', 'background-color:'+ color+' !important');
    });
    // find subject then search for it
    // rows = $(GMAIL_ROW_SELECTOR);
    // unreadRows.each(function(i, el){
    //     isRead = el.hasClass(GMAIL_READ_CLASS);
    //     el.find(GMAIL_INTERIOR_SELECTOR).each(function(i, el){
    //         if(!el.hasClass(GMAIL_SNIPPET_CLASS)){
    //             // do shit
    //         }
    //     });
    // });
}