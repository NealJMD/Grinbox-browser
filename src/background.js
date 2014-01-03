var account;
var mail;
var address;
var colorings; 
var grinboxBaseURL = 'http://127.0.0.1:8080/'
var grinboxLoginURL = grinboxBaseURL+'login'
var grinboxMailURL = grinboxBaseURL+'get-mail-with-classifications'
var allowLogin = true
var fwdrepattern = /^[^A-Z]*(RE|FWD)([^A-Z])+/i
var newlinepattern = /[\r\n]+/gi
var gmailTab;

var BUSINESS_COLOR = '#b6e5ea'// light blue
var FRIENDLY_COLOR = '#6efc58' // mint green
var BAD_NEWS_COLOR = '#ff6f3a' // orangey-red
var NEWSLETTER_COLOR = '#fcff56'// yellow

var GMAIL_READ_CLASS = 'y0';
var GMAIL_ROW_SELECTOR = '.cP table tr';
var GMAIL_INTERIOR_SELECTOR = '.xS span';
var GMAIL_SNIPPET_CLASS = 'y2';

function init() {
    account = new MailAccount({});
    account.onError = mailError;
    account.onUpdate = mailUpdate;
    colorings = {};
    // chrome.storage.local.get('colorings', function(result){
    //     colorings = result.colorings;
    // });
    // console.log(account.getMail());
}

function mailUpdate() {
    address = account.getAddress()
    request_params = {
        recipient: address,
        threading: 'threading'
    }
    $.ajax({
        type: 'GET',
        dataType: 'text',
        url: grinboxMailURL + '?' + $.param(request_params),
        success: function (data) { addMessages(data) },
        error: function (xhr, status, err) {
            if (xhr.status == 403 && allowLogin) {
                allowLogin = false
                chrome.tabs.create({
                    'url': grinboxLoginURL,
                    'active': true
                });
                window.setTimeout(function(){
                    allowLogin = true
                }, 10000)
            }
        }
    });
}

function addMessages(response_string){
    data = JSON.parse(response_string);
    $.each(data, function(i, email_data){
        color = getColor(email_data.formality, email_data.sentiment, email_data.commercialism);
        var clean_subject = sanitizeSubject(email_data.subject);
        colorings[clean_subject] = color;
    });
    console.log(colorings);
    chrome.storage.local.set({'colorings': colorings});
    chrome.tabs.sendMessage(gmailTab, colorings);
}

function sanitizeSubject(string){
    if (string == null){ return '(no subject)'; }
    if (string.length < 1){ return '(no subject)'; }
    var string2 = string.replace(newlinepattern, '');
    return string2.replace(fwdrepattern, '');
    // $.each(raw_data, function(i, email_data){
    //     raw_data[i].subject = email_data.subject.replace(fwdrepattern, '');
    // });
    // return raw_data;
}

function getColor(formal, positive, commercial){
    if (commercial) { return NEWSLETTER_COLOR; }
    if (!formal && !commercial) { return FRIENDLY_COLOR; }
    if (!positive && formal) { return BAD_NEWS_COLOR; }
    return BUSINESS_COLOR;
}

function mailError(_account) {
    console.log("Error with "+_account+"!");
}

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    request.get_options = request.get_options || false;
    request.get_colorings = request.get_colorings || false;
    response = {}
    if (request.get_options) {
        response.options = "options requested by page"
    }
    if (request.get_colorings) {
        response.colorings = colorings;
    }
    sendResponse(response);
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    var mailURL = "mail.google.com";
    if (changeInfo.status == 'loading' && tab.url.indexOf(mailURL) > -1) {
        gmailTab  = tabId;
        console.log("saw gmail! loading mail and classifications...");
        // chrome.tabs.sendMessage(tabId, colorings);
        window.setTimeout(mailUpdate, 0);
    }
});

$(document).ready(function(){
    init();   
});