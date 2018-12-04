var ts = require("./timeseries-processor");

module.exports = {
  name: "tsDetail",
  synonims: {},
  "internal aliases": {"step": "step", "stepType": "stepType"},
  defaultProperty: {},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var step = command.settings.step;
    var stepType = command.settings.stepType;
    var timeSeries = state.head.data.detail(step, stepType);
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
