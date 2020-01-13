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

    this.buffer = [['date_time','performance_time']];

    this.startLogging = function() {
        console.log("Start logging");

        setTimeout(that.capture, 100);
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

    this.capture = function() {
        that.addEvent([Date.now(), performance.now()]);

        setTimeout(that.capture, 10*Math.random());
    };
};


(function () {
    var b = new Biologger();
    // b.startLogging();

    for (var i = 0; i < 10000; i++) {
      b.addEvent([Date.now(), performance.now()]);
    }


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

    document.getElementById('plot').addEventListener('click', function () {
      var x = [];
      var y = [];

      for(var i = 1; i < b.buffer.length; i++) {
        x.push(b.buffer[i][1] - b.buffer[1][1]);
        y.push((b.buffer[i][0]-b.buffer[1][0]) - (b.buffer[i][1] - b.buffer[1][1]));
      }

      var trace1 = {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter'
      };
      var data = [trace1];

      Plotly.newPlot('scatter', data);
    }, false);

})();
