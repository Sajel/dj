var ts = require("./timeseries-processor");

module.exports = {
  name: "tsExponential",
  synonims: {},
  "internal aliases": {"alpha": "alpha"},
  defaultProperty: {"tsExponential": "alpha"},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var alpha = command.settings.tolerance;
    var timeSeries = state.head.data;
    var exp = timeSeries.exponentialSmoothing(alpha);
    state.head.type = "timeseries";
    state.head.data = exp;
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
