<template>
  <div class="container">
    <h1>Hello, {{ getUsername }}!</h1>
    <div>
      <router-link to="/solo">Solo</router-link>
      <br />Singleplayer mode with online ranking
    </div>
    <div>
      <router-link to="/solo">Multi</router-link>
      <br />Join others and race together
    </div>
  </div>
</template>
<script>
import { mapGetters } from "vuex";

export default {
  name: "Landing",
  components: {},
  computed: {
    ...mapGetters(["getUsername"])
  }
};
</script>

<style scoped>
.container {
  background-color: rgb(36, 35, 43);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  margin-top: 25px;
  padding: 25px;
  /* padding: 25px; */
}
</style>