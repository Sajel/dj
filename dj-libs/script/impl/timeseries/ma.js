var ts = require("./timeseries-processor");

module.exports = {
  name: "tsMa",
  synonims: {},
  "internal aliases": {"windowSize": "windowSize"},
  defaultProperty: {"tsMa": "windowSize"},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var windowSize = command.settings.windowSize;
    var timeSeries = state.head.data;
    var ma = timeSeries.ma(windowSize);
    state.head.type = "timeseries";
    state.head.data = ma;
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
