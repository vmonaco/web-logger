var KeyManager = {

    "default" : {
        0 : 'unknown',

        8 : 'backspace',
        9 : 'tab',
        13 : 'enter',
        16 : 'shift',
        17 : 'ctrl',
        18 : 'alt',
        19 : 'pause',
        20 : 'caps_lock',
        27 : 'escape',
        32 : 'space',
        33 : 'page_up',
        34 : 'page_down',
        35 : 'end',
        36 : 'home',
        37 : 'left',
        38 : 'up',
        39 : 'right',
        40 : 'down',

        44 : 'print_screen',
        45 : 'insert',
        46 : 'delete',

        48 : '0',
        49 : '1',
        50 : '2',
        51 : '3',
        52 : '4',
        53 : '5',
        54 : '6',
        55 : '7',
        56 : '8',
        57 : '9',

        59: 'semicolon',
        61: 'equals',

        65 : 'a',
        66 : 'b',
        67 : 'c',
        68 : 'd',
        69 : 'e',
        70 : 'f',
        71 : 'g',
        72 : 'h',
        73 : 'i',
        74 : 'j',
        75 : 'k',
        76 : 'l',
        77 : 'm',
        78 : 'n',
        79 : 'o',
        80 : 'p',
        81 : 'q',
        82 : 'r',
        83 : 's',
        84 : 't',
        85 : 'u',
        86 : 'v',
        87 : 'w',
        88 : 'x',
        89 : 'y',
        90 : 'z',

        91 : 'windows_start',

        93 : 'windows_menu',

        96 : 'numpad_0',
        97 : 'numpad_1',
        98 : 'numpad_2',
        99 : 'numpad_3',
        100 : 'numpad_4',
        101 : 'numpad_5',
        102 : 'numpad_6',
        103 : 'numpad_7',
        104 : 'numpad_8',
        105 : 'numpad_9',
        106 : 'numpad_multiply',
        107 : 'numpad_add',
        109 : 'numpad_subtract',
        110 : 'numpad_decimal',
        111 : 'numpad_divide',

        112 : 'f1',
        113 : 'f2',
        114 : 'f3',
        115 : 'f4',
        116 : 'f5',
        117 : 'f6',
        118 : 'f7',
        119 : 'f8',
        120 : 'f9',
        121 : 'f10',
        122 : 'f11',
        123 : 'f12',

        144 : 'num_lock',
        145 : 'scroll_lock',

        173: 'mute',
        174: 'volume_down',
        175: 'volume_up',
        186: 'semicolon',
        187: 'equals',
        188 : 'comma',
        189: 'dash',

        190 : 'period',
        191 : 'slash',
        192 : 'back_quote',

        219 : 'open_bracket',
        220 : 'back_slash',
        221 : 'close_bracket',
        222 : 'quote',
    },

    keyname : function(keycode) {
        if (keycode in this["default"]) {
            return this["default"][keycode];
        }

        console.log("Unknown keycode:", keycode);
        return "unknown";
    },
};

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

function Weblogger(enrollURL, flushDelay, questionID) {
    console.log('Web-logger init');

    var that = this; // Used in several closures below

    this.enrollURL = new URL(enrollURL);
    this.enrollURL.searchParams.set('type', 'event');

    this.metadataURL = new URL(enrollURL);
    this.metadataURL.searchParams.set('type', 'metadata');

    this.flushDelay = flushDelay;

    this.questionID = questionID;

    this.buffer = [];

    this.addEvent = function(e) {
        that.buffer.push(e);
    };

    this.keypress = function(e) {
        that.addEvent(['keypress', that.questionID, e.timeStamp, Date.now(), performance.now(), e.location, e.repeat, e.keyCode, e.target.id]);
    };

    this.keydown = function(e) {
        that.addEvent(['keydown', that.questionID, e.timeStamp, Date.now(), performance.now(), e.location, e.repeat, e.keyCode, e.target.id]);
    };

    this.keyup = function(e) {
        that.addEvent(['keyup', that.questionID, e.timeStamp, Date.now(), performance.now(), e.location, e.repeat, e.keyCode, e.target.id]);
    };

    this.mousedown = function(e) {
        that.addEvent(['mousedown', that.questionID, e.timeStamp, Date.now(), performance.now(), e.screenX, e.screenY, e.button, e.target.id]);
    };

    this.mouseup = function(e) {
        that.addEvent(['mouseup', that.questionID, e.timeStamp, Date.now(), performance.now(), e.screenX, e.screenY, e.button, e.target.id]);
    };

    this.mousemove = function(e) {
        that.addEvent(['mousemove', that.questionID, e.timeStamp, Date.now(), performance.now(), e.screenX, e.screenY, e.buttons, e.target.id]);
    };

    this.wheel = function(e) {
        that.addEvent(['mousewheel', that.questionID, e.timeStamp, Date.now(), performance.now(), e.deltaX, e.deltaY, e.deltaMode, e.target.id]);
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
            navigator.sendBeacon(that.enrollURL, that.gatherEvents());
            that.emptyBuffer();
        }, this.flushDelay);

        hook(window, 'unload', function () {
            navigator.sendBeacon(that.enrollURL, that.gatherEvents());
            that.emptyBuffer();
        });

        navigator.sendBeacon(that.metadataURL, that.gatherMetadata());
    };
};
