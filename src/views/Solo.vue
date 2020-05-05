<template>
  <div class="container">
    <TypeGame v-if="textId" :textId="textId" />
    <br />
    <TextLeaderboard v-if="textId" :textId="textId" />
  </div>
</template>

<script>
import axios from "axios";
import TypeGame from "../components/TypeGame";
import TextLeaderboard from "../components/TextLeaderboard";

export default {
  name: "Solo",
  components: {
    TypeGame,
    TextLeaderboard
  },
  data() {
    return {
      textId: ""
    };
  },
  watch: {
    $route: function() {
      if (!this.$route.query.text) {
        this.textId = "";
        this.getNewText();
      }
    }
  },
  methods: {
    getNewText: function() {
      axios.get(`http://localhost:5000/texts`).then(res => {
        this.textId = res.data[Math.floor(Math.random() * res.data.length)]._id;
        this.$router.replace({ name: "solo", query: { text: this.textId } });
      });
    }
  },
  created: function() {
    if (!this.$route.query.text) {
      this.getNewText();
    } else {
      this.textId = this.$route.query.text;
    }
  }
};
</script>

<style scoped>
.container {
  background-color: rgb(36, 35, 43);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  margin-top: 25px;
  padding: 25px;
  text-align: left;
  width: 750px;
}
</style>