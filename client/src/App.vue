<template>
  <div id="app" style="background-color: rgb(24, 23, 28);">
    <Navbar />
    <router-view />
    <footer class="footer"></footer>
  </div>
</template>

<script>
import Navbar from "./components/Navbar.vue";
import { mapActions } from "vuex";
const jwt = require("jsonwebtoken");

export default {
  name: "App",
  components: {
    Navbar
  },
  methods: {
    ...mapActions(["declareUsername"])
  },
  mounted: function() {
    if (localStorage.getItem("token")) {
      this.declareUsername(jwt.decode(localStorage.getItem("token")).username);
    }
  }
};
</script>

<style>
#app {
  font-family: "Baloo Bhaina 2", cursive;
  /* font-family: proxima-nova, sans-serif; Avenir, Helvetica, Arial */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
  height: 50%;
}

footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 50px;
  /* line-height: 60px; */
  background-color: rgb(36, 35, 43);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
</style>
