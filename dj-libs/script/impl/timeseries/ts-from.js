var ts = require("./timeseries-processor");

module.exports = {
  name: "tsFrom",
  synonims: {},
  "internal aliases": {"from": "from"},
  defaultProperty: {"tsFrom": "from"},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var from = command.settings.from;
    if(!(from instanceof Date)) {
      from = new Date(from);
    }
    var timeSeries = state.head.data.from(from);
    state.head.data = timeSeries;
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
