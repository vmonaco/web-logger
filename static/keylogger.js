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

function csv_string(values) {
    var finalVal = '';
    for (var j = 0; j < values.length; j++) {
        var innerValue = values[j] === null ? '' : '' + values[j];
        var result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0)
            result = '"' + result + '"';
        if (j > 0)
            finalVal += ',';
        finalVal += result;
    }
    return finalVal;
}

function Keylogger(flushDelay, enrollURL) {
    console.log("Keylogger init");

    var that = this; // Used in several closures below

    // Logging parameters
    this.flushDelay = flushDelay;
    this.enrollURL = enrollURL;

    // Key/button states
    this.keysdown = [];
    this.buttonsdown = [];
    this.dragging = 0;

    this.buffer = {
        keystroke : [],
        mousemotion : [],
        mouseclick : [],
        mousescroll: [],
    };

    this.jsonData = function () {
        var bd = {};
        for (b in this.buffer) {
            if (this.buffer[b].length > 0) {
                bd[b] = this.buffer[b].join("\n");
            }
        }
        return bd;
    };

    this.startLogging = function () {
        console.log("Start logging");

        for (e in this.events) {
            $(document).unbind(e).on(e, function (e) {
                return function (evtData) {
                    that.events[e].call(that, evtData);
                };
            }(e));
        }

        this.flushTimer = setInterval(function () {
            that.flushBuffer(true);
        }, this.flushDelay);
    };

    this.stopLogging = function () {
        console.log("Stop logging");
        clearInterval(this.flushTimer);

        for (e in this.events) {
            $(document).unbind(e);
        }

        if (this.bufferSize() === 0) {
            return;
        }

        this.flushBuffer(false);
        this.emptyBuffer();
    };

    this.bufferSize = function () {
        var size = 0;
        for (b in this.buffer) {
            size += this.buffer[b].length;
        }
        return size;
    };

    this.emptyBuffer = function () {
        for (b in this.buffer) {
            this.buffer[b] = [];
        }
    };

    this.flushBuffer = function (async) {
        if (this.bufferSize() === 0) {
            // console.log("Skipping flush, 0 events.");
            return;
        }

        $.ajax({
            type: "POST",
            url: this.enrollURL,
            async: async,
            data: this.jsonData(),
        }).done(function (msg) {
            console.log(msg);
        });

        console.log("Sent " + this.bufferSize() + " events");
        this.emptyBuffer();
    };

    this.keydown = function (e) {
        // Ignore repeated keystrokes.
        if (e.keyCode in this.keysdown && this.keysdown[e.keyCode]) {
            return;
        }

        console.log("Key down: ", e.keyCode, e.timeStamp);
        this.keysdown[e.keyCode] = {
            "timepress": e.timeStamp,
            "selectionstartpress": (typeof e.target.selectionStart == 'undefined') ? -1 : e.target.selectionStart,
            "selectionendpress": (typeof e.target.selectionEnd == 'undefined') ? -1 : e.target.selectionEnd
        };
    };

    this.keyup = function (e) {
        // Ignore keys that haven't already been pressed
        if (!this.keysdown[e.keyCode]) {
            return;
        }
        console.log("Key up: ", e.keyCode, KeyManager.keyname(e.keyCode), e.timeStamp);

        this.buffer.keystroke.push(csv_string([
            this.keysdown[e.keyCode]["timepress"],          // timepress
            e.timeStamp,                                    // timerelease
            e.keyCode,                                      // keycode
            KeyManager.keyname(e.keyCode),                  // keyname
            e.target.id,                                    // target
            this.keysdown[e.keyCode]["selectionstartpress"],
            this.keysdown[e.keyCode]["selectionendpress"],
            (typeof e.target.selectionStart == 'undefined') ? -1 : e.target.selectionStart,
            (typeof e.target.selectionEnd == 'undefined') ? -1 : e.target.selectionEnd
        ]));

        this.keysdown[e.keyCode] = false;
    };

    this.mousedown = function(e) {
        console.log("Mouse pressed: ", e.timeStamp);

        this.dragging = e.button;

        this.buttonsdown[e.button] = {
            "timepress" : e.timeStamp,
            "xpress" : e.screenX,
            "ypress" : e.screenY,
            "xoffsetpress" : e.offsetX,
            "yoffsetpress" : e.offsetY,
            "targetwidthpress" : e.target.clientWidth,
            "targetheightpress" : e.target.clientHeight,
            "targetpress" : e.target.id,
            "selectionstartpress": (typeof e.target.selectionStart == 'undefined') ? -1 : e.target.selectionStart,
            "selectionendpress": (typeof e.target.selectionEnd == 'undefined') ? -1 : e.target.selectionEnd
        };
    };

    this.mouseup = function(e) {
        // Ignore buttons that haven't already been pressed
        if (!this.buttonsdown[e.button]) {
            return;
        }

        console.log("Mouse released: ", e.timeStamp);

        this.buffer.mouseclick.push(csv_string([
            this.buttonsdown[e.button]['timepress'],
            e.timeStamp,
            e.button,
            this.buttonsdown[e.button]['xpress'],
            this.buttonsdown[e.button]['ypress'],
            this.buttonsdown[e.button]['xoffsetpress'],
            this.buttonsdown[e.button]['yoffsetpress'],
            this.buttonsdown[e.button]['targetwidthpress'],
            this.buttonsdown[e.button]['targetheightpress'],
            this.buttonsdown[e.button]['targetpress'],
            this.buttonsdown[e.button]['selectionstartpress'],
            this.buttonsdown[e.button]['selectionendpress'],
            e.screenX,
            e.screenY,
            e.offsetX,
            e.offsetY,
            e.target.clientWidth,
            e.target.clientHeight,
            e.target.id,
            (typeof e.target.selectionStart == 'undefined') ? -1 : e.target.selectionStart,
            (typeof e.target.selectionEnd == 'undefined') ? -1 : e.target.selectionEnd
        ]));

        this.buttonsdown[e.button] = false;
    };

    this.mousemove = function(e) {
        console.log("Mouse move: ", e.screenX, e.screenY, e.timeStamp, e.target.id);

        this.buffer.mousemotion.push(csv_string([
            e.timeStamp,
            e.screenX,
            e.screenY,
            e.pageX,
            e.pageY,
            e.offsetX,
            e.offsetY,
            e.target.clientWidth,
            e.target.clientHeight,
            this.dragging,
            e.target.id
        ]));
    };

    this.mousewheel = function(e) {
        console.log("Mouse scroll: ", e.deltaX, e.deltaY, e.deltaFactor);

        this.buffer.mousescroll.push(csv_string([
            e.timeStamp,
            e.deltaX,
            e.deltaY,
            e.deltaMode,
            e.deltaFactor,
            e.screenX,
            e.screenY,
            e.pageX,
            e.pageY,
            e.offsetX,
            e.offsetY,
            e.target.clientWidth,
            e.target.clientHeight,
            e.target.id
        ]));
    };

    this.events = {
        keydown: that.keydown,
        keyup : that.keyup,
        mousedown : that.mousedown,
        mouseup : that.mouseup,
        mousemove : that.mousemove,
        mousewheel : that.mousewheel,
    };
};
