<template>
  <div class="container">
    <b-table style="color: white" :items="leaderboard" :fields="fields" responsibe="sm">
      <template v-slot:cell(rank)="data">#{{ data.index + 1 }}</template>

      <template v-slot:cell(pp)="data">{{ Math.round(data.item.pp) }}</template>

      <template v-slot:cell(wpmAvg)="data">
        {{
        Math.trunc(data.item.wpmAvg * 100) / 100
        }}
      </template>

      <template v-slot:cell(accAvg)="data">{{ Math.trunc(data.item.accAvg * 100) / 100 }}%</template>
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
        "Rank",
        {
          key: "username",
          label: "Username"
        },
        {
          key: "pp",
          label: "Performance"
        },
        {
          key: "wpmAvg",
          label: "WPM Average"
        },
        {
          key: "accAvg",
          label: "Accuracy Average"
        }
      ],
      maxWPM: 0,
      leaderboard: []
    };
  },
  created() {
    axios.get("https://api-type-gg.tk/rankings").then(res => {
      this.leaderboard = res.data;
      console.log(this.leaderboard);
    });
  },
  mounted() {}
};
</script>

<style scoped>
.container {
  background-color: rgb(36, 35, 43);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  margin-top: 25px;
  padding: 25px;
  text-align: left;
}
</style>
