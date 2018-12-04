var ts = require("./timeseries-processor");

module.exports = {
  name: "tsAggSum",
  synonims: {},
  "internal aliases": {"interval": "interval", "intervalType": "intervalType"},
  defaultProperty: {},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var interval = command.settings.interval;
    var intervalType = command.settings.intervalType;
    var timeSeries = state.head.data.sum({interval: interval, intervalType: intervalType});
    timeSeries.forEach(function (element) {
      delete element.elements;
    });
    state.head.data = timeSeries;
    state.head.type = 'timeseries';
    return state;
  },

  help: {
    synopsis: "Smooth timeseries with moving average method",

    name: {
      "default": "ma",
      synonims: []
    },
    input: ["string"],
    output: "timeseries",
    "default param": "none",

    params: [],

    example: {
      description: "Moving average"
    }
  }
}
