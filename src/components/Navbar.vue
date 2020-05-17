<template>
  <div>
    <b-navbar
      toggleable="lg"
      type="dark"
      style="background-color: rgb(86, 57, 173); height: 50px;"
    >
      <div class="container">
        <b-navbar-brand style="white-space: pre-line;">
          <span>Type</span>
          <b>GG</b><small>alpha</small>
          <!-- <small v-if="pageName">{{ pageName }}</small> -->
        </b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav>
            <b-nav-item to="/">Home</b-nav-item>
            <b-nav-item to="/rankings">Rankings</b-nav-item>
          </b-navbar-nav>

          <!-- Right aligned nav items -->
          <b-navbar-nav
            style="margin-top: 10px"
            class="ml-auto"
            v-if="loggedIn"
          >
            <b-nav-item-dropdown variant="primary" right>
              <!-- Using 'button-content' slot-->
              <template v-slot:button-content>
                {{ getUsername }}
                | Lv: {{ level }} |
                {{ getXP - totalXPbeforeLevel }}/{{ xpToLevel }}xp
                <b-progress style="height:5px" :max="xpToLevel">
                  <b-progress-bar
                    :value="getXP - totalXPbeforeLevel"
                    variant="success"
                  ></b-progress-bar>
                </b-progress>
              </template>
              <b-dropdown-item to="/profile">Profile</b-dropdown-item>
              <b-dropdown-item @click="logout">Logout</b-dropdown-item>
            </b-nav-item-dropdown>
          </b-navbar-nav>
        </b-collapse>
      </div>
    </b-navbar>
  </div>
</template>

<script>
import axios from "axios";
import jwt from "jsonwebtoken";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "Navbar",
  data() {
    return {
      stats: {},
    };
  },
  computed: {
    ...mapGetters(["getUsername", "getXP"]),
    pageName() {
      return this.$route.name;
    },
    loggedIn() {
      return !(this.getUsername === "" || this.getUsername === null);
    },
    level() {
      return Math.floor(Math.sqrt(this.getXP) / 25);
    },
    totalXPbeforeLevel() {
      let total = 0;
      for (var i = 1; i <= this.level; i++) {
        total += this.xp(i);
      }
      return total;
    },
    xpToLevel() {
      return Math.pow(25 * (this.level + 1), 2) - Math.pow(25 * this.level, 2);
    },
  },
  methods: {
    ...mapActions(["clearUsername", "setXP"]),
    logout() {
      localStorage.clear();
      this.clearUsername();
      this.$router.push("/login");
    },
    xp(level) {
      return Math.pow(25 * level, 2) - Math.pow(25 * (level - 1), 2);
    },
  },
  mounted() {
    let username = jwt.decode(localStorage.getItem("token")).username;
    axios
      .get(`https://api-type-gg.tk/stats/${username}`)
      .then((res) => {
        this.stats = res.data;
        console.log(res.data);
        this.setXP(this.stats.xp);
      })
      .catch((err) => console.log(err));
  },
};
</script>

<style scoped></style>
