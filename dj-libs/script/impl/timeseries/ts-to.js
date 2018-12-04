var ts = require("./timeseries-processor");

module.exports = {
  name: "tsTo",
  synonims: {},
  "internal aliases": {"to": "to"},
  defaultProperty: {"tsTo": "to"},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var to = command.settings.to;
    if(!(to instanceof Date)) {
      to = new Date(to);
    }
    var timeSeries = state.head.data.to(to);
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
