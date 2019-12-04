function addEvent(element, evnt, funct){
  if (element.attachEvent)
   return element.attachEvent('on'+evnt, funct);
  else
   return element.addEventListener(evnt, funct, false);
}

function removeEvent(element, evnt, funct){
  if (element.detachEvent)
   return element.detachEvent('on'+evnt, funct);
  else
   return element.removeEventListener(evnt, funct, false);
}

function makeTextFile(textFile, text) {
  var data = new Blob([text], {type: 'text/plain'});

  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }

  textFile = window.URL.createObjectURL(data);

  return textFile;
};

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

function Biologger(params, userid, sesskey, enrollURL, flushDelay) {
    console.log("Biologger init");

    var that = this; // Used in several closures below

    this.buffer = [['event','time','date_time','performance_time','x','y','z']];

    this.startLogging = function() {
        console.log("Start logging");

        for (e in this.events) {
            addEvent(
                window,
                e,
                that.events[e]
            );
        };

    };

    this.stopLogging = function() {
        console.log("Stop logging");

        for (e in this.events) {
            removeEvent(
                window,
                e,
                that.events[e]
            );
        };
    };

    this.addEvent = function(e) {
        that.buffer.push(e);
    };

    this.getEvents = function() {
        return that.buffer.map(makeCSV).join("\n");
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
};

(function () {
    var b = new Biologger();
    b.startLogging();

    addEvent(
        window,
        'beforeunload',
        function () { b.stopLogging(); }
    );

    var textFile = null;
    var save = document.getElementById('save');

    save.addEventListener('click', function () {
      var link = document.createElement('a');
      link.setAttribute('download', performance.timeOrigin + '.csv');
      link.href = makeTextFile(textFile, b.getEvents());
      document.body.appendChild(link);

      // wait for the link to be added to the document
      window.requestAnimationFrame(function () {
        var event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
  		});

    }, false);
})();
