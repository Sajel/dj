var ts = require("./timeseries-processor");

module.exports = {
    name: "tsAverageAbsoluteIncrease",
  synonims: {},
  defaultProperty: {},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var timeSeries = state.head.data;
    state.head.type = "json";
    state.head.data = timeSeries.averageAbsoluteIncrease();
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
