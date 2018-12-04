var ts = require("./timeseries-processor");

module.exports = {
    name: "tsSimplify",
  synonims: {},
  "internal aliases": {"tolerance": "tolerance"},
  defaultProperty: {"tsSimplify": "tolerance"},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var tolerance = command.settings.tolerance;
    var timeSeries = state.head.data;
    var simplified = timeSeries.simplify(tolerance);
    state.head.type = "timeseries";
    state.head.data = simplified;
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
