function hook(element, evnt, funct){
  if (element.attachEvent)
   return element.attachEvent('on'+evnt, funct);
  else
   return element.addEventListener(evnt, funct, false);
}

function unhook(element, evnt, funct){
  if (element.detachEvent)
   return element.detachEvent('on'+evnt, funct);
  else
   return element.removeEventListener(evnt, funct, false);
}

function makeCSV(values) {
    var finalVal = '';

    for (var j = 0; j < values.length; j++) {
        var innerValue =  values[j]===null?'':''+values[j];
        var result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0)
            result = '"' + result + '"';
        if (j > 0)
            finalVal += ',';
        finalVal += result;
    }
    return finalVal;
}

function sendData(url, data, onsuccess) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onload = function (e) {
    if (xhr.readyState === 4) {
        if (xhr.status === 200) {
            console.log(xhr.responseText);
            onsuccess();
        } else {
            console.error(xhr.statusText);
        }
      }
    };
    xhr.onerror = function (e) {
        console.error(xhr.statusText);
    };
    xhr.send(JSON.stringify(data));
}

function Weblogger(eventsURL, flushDelay) {
    console.log('Weblogger init');

    var that = this; // Used in several closures below

    this.eventsURL = new URL(eventsURL);
    this.eventsURL.searchParams.set('type', 'events');

    this.metadataURL = new URL(eventsURL);
    this.metadataURL.searchParams.set('type', 'metadata');

    this.flushDelay = flushDelay;

    this.buffer = [];

    this.addEvent = function(e) {
        that.buffer.push(e);
    };

    this.keypress = function(e) {
        that.addEvent(['keypress', e.timeStamp, Date.now(), performance.now(), e.location, e.repeat, e.keyCode]);
    };

    this.keydown = function(e) {
        that.addEvent(['keydown', e.timeStamp, Date.now(), performance.now(), e.location, e.repeat, e.keyCode]);
    };

    this.keyup = function(e) {
        that.addEvent(['keyup', e.timeStamp, Date.now(), performance.now(), e.location, e.repeat, e.keyCode]);
    };

    this.mousedown = function(e) {
        that.addEvent(['mousedown', e.timeStamp, Date.now(), performance.now(), e.screenX, e.screenY, e.button]);
    };

    this.mouseup = function(e) {
        that.addEvent(['mouseup', e.timeStamp, Date.now(), performance.now(), e.screenX, e.screenY, e.button]);
    };

    this.mousemove = function(e) {
        that.addEvent(['mousemove', e.timeStamp, Date.now(), performance.now(), e.screenX, e.screenY, e.buttons]);
    };

    this.wheel = function(e) {
        that.addEvent(['mousewheel', e.timeStamp, Date.now(), performance.now(), e.deltaX, e.deltaY, e.deltaMode]);
    };

    this.events = {
        keypress: that.keypress,
        keydown: that.keydown,
        keyup : that.keyup,
        mousedown : that.mousedown,
        mouseup : that.mouseup,
        mousemove : that.mousemove,
        wheel : that.wheel,
    };

    this.emptyBuffer = function () {
        that.buffer = [];
    };

    this.gatherEvents = function(e) {
        return that.buffer.join('\n');
    };

    this.gatherMetadata = function () {
        return [
          ['user_agent',navigator.userAgent],
          ['app_version',navigator.appVersion],
          ['locale',navigator.language],
          ['timezone',(new Date()).getTimezoneOffset()],
          ['screen_height',window.screen.height],
          ['screen_width',window.screen.width],
          ['screen_avail_height',window.screen.availHeight],
          ['screen_avail_width',window.screen.availWidth],
          ['screen_color_depth',window.screen.colorDepth],

        ].map(makeCSV).join('\n');
    };

    this.startLogging = function() {
        console.log('Start logging');

        for (e in this.events) {
            hook(
                window,
                e,
                that.events[e]
            );
        };

        this.flushTimer = setInterval(function () {
            if (that.buffer.length === 0) {
                return;
            }
            navigator.sendBeacon(that.eventsURL, that.gatherEvents());
        }, this.flushDelay);

        hook(window, 'unload', function () {
            navigator.sendBeacon(that.eventsURL, that.gatherEvents());
        });

        navigator.sendBeacon(that.metadataURL, that.gatherMetadata());
    };
};
