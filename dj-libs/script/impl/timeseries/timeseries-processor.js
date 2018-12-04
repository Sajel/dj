var _ = require('underscore');
var math = require('mathjs');
var simplify = require('simplify-js');

var TimeSeries = function (data) {
  this.data = data.slice(0)
    .map(function (element) {
      return {time: new Date(element.time), value: element.value};
    })
    .sort(function (a, b) {
      return a.time.getTime() - b.time.getTime();
    });
};
TimeSeries.prototype.copyElement = function (element) {
  return {time: element.time, value: element.value};
};

TimeSeries.prototype.ma = function (windowSize) {
  var length = this.data.length;
  if (windowSize > length) {
    return new TimeSeries(this.data.slice());
  }
  var newTimeSeriesData = [];
  for (var i = 0; i < length; i++) {
    if (i < windowSize || i == length - 1) {
      newTimeSeriesData[i] = this.copyElement(this.data[i]);
    } else {
      newTimeSeriesData[i] = {time: this.data[i].time};
      var value = 0;
      for (var j = i; j > i - windowSize; j--) {
        value += this.data[j].value;
      }
      newTimeSeriesData[i].value = value / windowSize;
    }
  }
  return new TimeSeries(newTimeSeriesData);
};

function findPerpendicularDistance(point, line) {
  var pointX = point.time.getTime(),
    pointY = point.value,
    lineStart = {
      x: line[0].time.getTime(),
      y: line[0].value
    },
    lineEnd = {
      x: line[1].time.getTime(),
      y: line[1].value
    },
    slope = (lineEnd.y - lineStart.y) / (lineEnd.x - lineStart.x),
    intercept = lineStart.y - (slope * lineStart.x),
    result;
  result = Math.abs(slope * pointX - pointY + intercept) / Math.sqrt(Math.pow(slope, 2) + 1);
  return result;
}

function douglasPeuckerSimplification(points, epsilon) {
  var i,
    maxIndex = 0,
    maxDistance = 0,
    perpendicularDistance,
    leftRecursiveResults, rightRecursiveResults,
    filteredPoints;
  // find the point with the maximum distance
  for (i = 2; i < points.length - 1; i++) {
    perpendicularDistance = findPerpendicularDistance(points[i], [points[1], points[points.length - 1]]);
    if (perpendicularDistance > maxDistance) {
      maxIndex = i;
      maxDistance = perpendicularDistance;
    }
  }
  // if max distance is greater than epsilon, recursively simplify
  if (maxDistance >= epsilon) {
    leftRecursiveResults = douglasPeuckerSimplification(points.slice(1, maxIndex), epsilon);
    rightRecursiveResults = douglasPeuckerSimplification(points.slice(maxIndex), epsilon);
    filteredPoints = leftRecursiveResults.concat(rightRecursiveResults);
  } else {
    filteredPoints = points;
  }
  return filteredPoints;
}

TimeSeries.prototype.simplify = function (epsilon) {
  var points = this.data.map(function (element) {
    return {x : element.time.getTime(), y : element.value}
  });
  var simplified = simplify(points);
  var simplifiedData = simplified.map(function (element) {
    return {time : new Date(element.x), value : element.y};
  });
  return new TimeSeries(simplifiedData);
};

TimeSeries.prototype.exponentialSmoothing = function (alpha) {
  if (alpha <= 0 || alpha >= 1) {
    throw Error("Alpha must be in (0;1) range.")
  }
  var data = new Array(this.data.length);
  data[0] = this.copyElement(this.data[0]);
  for (var i = 1; i < data.length; i++) {
    data[i] = {
      time: this.data[i].time,
      value: data[i - 1].value + alpha * (this.data[i].value - data[i - 1].value)
    };
  }
  return new TimeSeries(data);
};

TimeSeries.prototype.average = function () {
  return this.data.map(element => element.value).reduce((a, b)=>a + b, 0) / this.data.length;
};

TimeSeries.prototype.max = function () {
  return _.max(this.data, element => element.value);
};

TimeSeries.prototype.min = function () {
  return _.min(this.data, element => element.value);
};

TimeSeries.prototype.variance = function () {
  var average = this.average();
  return this.data
      .map(element => average - element.value)
      .map(value => Math.pow(value, 2))
      .reduce((a, b)=>a + b, 0)
    / this.data.length;
};

TimeSeries.prototype.deviation = function () {
  return Math.sqrt(this.variance());
};

TimeSeries.prototype.averageAbsoluteIncrease = function () {
  var result = 0;
  for (var i = 1; i < this.data.length; i++) {
    result += Math.abs(this.data[i].value - this.data[i - 1].value);
  }
  result /= this.data.length;
  return result;
};

TimeSeries.prototype.from = function (from) {
  return new TimeSeries(this.data.filter(element => element.time >= from));
};

TimeSeries.prototype.to = function (to) {
  return new TimeSeries(this.data.filter(element => element.time <= to));
};

TimeSeries.prototype.between = function (from, to) {
  return new TimeSeries(this.data
    .filter(element => element.time >= from && element.time <= to));
};

var AggregationGroup = function (startTime, endTime) {
  return {
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    elements: [],
    addElement: function (element) {
      this.elements.push(element);
    }
  }
};

TimeSeries.prototype.truncateTimeSeries = function (parameters) {
  var timeSeries = this;
  if (parameters.from && parameters.to) {
    timeSeries = this.between(parameters.from, parameters.to);
  } else if (parameters.from) {
    timeSeries = this.from(parameters.from);
  } else if (parameters.to) {
    timeSeries = this.to(parameters.to);
  }
  return new TimeSeries(timeSeries.data);
};

function getIntervalInMillis(interval, intervalType) {
  interval = math.unit(interval, intervalType);
  return interval.to('millisecond').toNumber();
}

function groupByIntervals(timeSeries, intervalMillis) {
  var groups = [];
  var intervalEnd = timeSeries.data[0].time.getTime() + intervalMillis;
  var currentGroup = new AggregationGroup(timeSeries.data[0].time, intervalEnd);
  timeSeries.data.forEach(function (element) {
    if (element.time.getTime() <= intervalEnd) {
      currentGroup.elements.push(element);
    } else {
      groups.push(currentGroup);
      currentGroup = new AggregationGroup(currentGroup.endTime, intervalEnd);
      intervalEnd += intervalMillis;
      currentGroup.elements.push(element);
    }
  });
  groups.push(currentGroup)
  return groups;
}

TimeSeries.prototype.aggregate = function (parameters) {
  var timeSeries = this.truncateTimeSeries(parameters);
  var intervalMillis = getIntervalInMillis(parameters.interval, parameters.intervalType);
  var groups = groupByIntervals(timeSeries, intervalMillis);
  var aggregationFunctions = parameters.aggregationFunctions;
  if (!aggregationFunctions) {
    aggregationFunctions = [];
  }
  groups.forEach(function (group) {
    aggregationFunctions.forEach(function (aggFunction) {
      var result = aggFunction(group);
      group[result.name] = result.value;
    })
  });
  return groups;
};

TimeSeries.prototype.sum = function (aggregationParameters) {
  var sum = function (group) {
    return {
      name: "sum",
      value: group.elements.reduce((a, b) => a + b.value, 0)
    }
  };
  if (!aggregationParameters.aggregationFunctions)
    aggregationParameters.aggregationFunctions = [];
  aggregationParameters.aggregationFunctions.push(sum);
  return this.aggregate(aggregationParameters);
};

TimeSeries.prototype.detail = function (step, stepType = 'millisecond') {
  step = getIntervalInMillis(step, stepType);
  var data = this.data.slice(0).map(function (element) {
    return {time: new Date(element.time), value: element.value};
  });
  if (data.length > 1) {
    for (var i = 1; i < this.data.length; i++) {
      var diff = this.data[i].time - this.data[i - 1].time;
      var valueDiff = this.data[i].value - this.data[i - 1].value;
      var pointsCount = Math.floor(diff / step) - 1;
      for (var j = 0; j < pointsCount; j++) {
        var newTime = this.data[i - 1].time.getTime() + diff * (j + 1) / pointsCount;
        var newValue = this.data[i - 1].value + valueDiff * (j + 1) / pointsCount;
        data.splice(i + j, 0, {time: new Date(newTime), value: newValue});
      }
    }
  }
  return new TimeSeries(data);
};

var generateRandomData = function (startYear, points, epsilon = 0.2) {
  var result = [];
  for (var i = 0; i < points; i++) {
    var time = new Date(startYear, i + 1, 1);
    var value;
    if (i == 0) {
      value = ( Math.random() * 100);
    } else {
      var prev = result[i - 1].value;
      var min = (1 - epsilon) * prev;
      var max = (1 + epsilon) * prev;
      value = Math.random() * (max - min) + min;
    }
    result[i] = {time: time, value: value};
  }
  return result;
};

function validateIsTimeSeries(timeEventSeries) {
  timeEventSeries.intervals.forEach(function (interval) {
    if (interval.leftBound != interval.rightBound || interval.valueDefinition != 'timeseries-element') {
      throw new Error('This series cannot be converted to timeseries');
    }
  });
}

var timeSeriesMapper = {
  mapToGeneralTimeSeriesEventForm: function (timeSeries) {
    var intervals = timeSeries.data.map(function (element) {
      return {
        leftBound: element.time,
        rightBound: element.time,
        value: element.value,
        valueDefinition: 'timeseries-element'
      }
    });
    return {intervals: intervals};
  },
  mapFromGeneralTimeSeriesEventForm: function (timeEventSeries) {
    validateIsTimeSeries(timeEventSeries);
    var data = timeEventSeries.intervals.map(function (interval) {
      return {
        time: new Date(interval.leftBound),
        value: interval.value
      };
    });
    return new TimeSeries(data);
  }
};

function wasEventInTheInterval(causeSeries, interval) {
  for (var i = 0; i < causeSeries.intervals.length; i++) {
    var element = causeSeries.intervals[i];
    var leftBound;
    var rightBound;
    if (!element.period) {
      rightBound = element.leftBound;
      leftBound = element.rightBound;
    } else {
      var period = element.period.period;
      var duration = element.period.duration;
      var periodNumber = Math.floor((interval.leftBound - element.leftBound ) / period);
      if (!duration || duration <= periodNumber) {
        leftBound = new Date(element.leftBound.getTime() + period * periodNumber);
        rightBound = new Date(element.rightBound + period * periodNumber);
      }
    }
    if (leftBound <= interval.leftBound && rightBound >= interval.rightBound)
      return true;
  }
  return false;
}

var probabilitySeriesValuesAreAboveCauseOfEvent = function (series, causeSeries, value) {
  var allAppropriateIntervalsCount = 0;
  var causedAppropriateIntervalsCount = 0;
  series.intervals.forEach(function (interval) {
    var time = interval.leftBound;
    if (interval.value >= value) {
      allAppropriateIntervalsCount++;
      if (wasEventInTheInterval(causeSeries, interval)) {
        causedAppropriateIntervalsCount++;
      }
    }
  });
  return causedAppropriateIntervalsCount / allAppropriateIntervalsCount;
};

exports.generateRandomData = generateRandomData;
exports.TimeSeries = TimeSeries;
exports.timeSeriesMapper = timeSeriesMapper;
exports.probabilitySeriesValuesAreAboveCauseOfEvent = probabilitySeriesValuesAreAboveCauseOfEvent;
