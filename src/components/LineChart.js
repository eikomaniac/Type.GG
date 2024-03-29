import { Line, mixins } from "vue-chartjs";
const { reactiveProp } = mixins;

export default {
  extends: Line,
  mixins: [reactiveProp],
  // props: ["options"],
  data() {
    return {
      options: {
        legend: {
          display: true,
          labels: {
            fillStyle: "#123123",
            usePointStyle: true,
          },
        },
        scales: {
          xAxes: [
            {
              ticks: {
                display: false,
              },
            },
          ],
        },
      },
    };
  },
  mounted() {
    // this.chartData is created in the mixin.
    // If you want to pass options please create a local options object
    this.renderChart(this.chartData, this.options);
  },
};
