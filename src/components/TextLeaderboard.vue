<template>
  <div>
    <b-table
      style="color: white"
      :items="leaderboard"
      :fields="fields"
      responsibe="sm"
    >
      <template v-slot:cell(rank)="data">#{{ data.index + 1 }}</template>

      <template v-slot:cell(wpm)="data">{{
        trunc2dp(data.item.wpm)
      }}</template>

      <template v-slot:cell(accuracy)="data"
        >{{ trunc2dp(data.item.accuracy) }}%</template
      >

      <template v-slot:cell(performance)="data">{{
        Math.round(data.item.performance)
      }}</template>
    </b-table>
  </div>
</template>

<script>
import axios from "axios";

export default {
  props: ["textId"],
  data() {
    return {
      fields: [
        "RANK",
        {
          key: "wpm",
          label: "WPM",
        },
        {
          key: "accuracy",
          label: "ACCURACY",
        },
        {
          key: "username",
          label: "USERNAME",
        },
        {
          key: "performance",
          label: "PERFORMANCE",
        },
      ],
      maxWPM: 0,
      leaderboard: [],
    };
  },
  methods: {
    trunc2dp(val) {
      return (Math.trunc(val*100)/100).toFixed(2);
    },
  },
  created() {
    axios
      .get(
        `https://api-type-gg.tk/replays/?q={"textId":"${this.textId}","isPB":"true"}`
      )
      .then((res) => {
        this.leaderboard = res.data;
        this.maxWPM = this.leaderboard[0] ? this.leaderboard[0].wpm : 0;
        for (var i = 0; i < this.leaderboard.length; i++) {
          this.leaderboard[i].performance =
            100 *
            (Math.pow(
              Math.exp(1),
              (this.leaderboard[i].wpm * Math.log(11)) / this.maxWPM
            ) -
              1);
        }
        console.log(this.leaderboard);
      });
  },
  mounted() {},
};
</script>

<style scoped></style>
