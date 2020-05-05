import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    username: "",
    xp: "",
  },
  getters: {
    getUsername(state) {
      return state.username;
    },
    getXP(state) {
      return state.xp;
    },
  },
  mutations: {
    DECLARE_USERNAME(state, newUsername) {
      state.username = newUsername;
    },
    CLEAR_USERNAME(state) {
      state.username = "";
    },
    SET_XP(state, xp) {
      state.xp = xp;
    },
    INCREASE_XP(state, xp) {
      state.xp += xp;
    },
  },
  actions: {
    declareUsername({ commit }, username) {
      commit("DECLARE_USERNAME", username);
    },
    clearUsername({ commit }) {
      commit("CLEAR_USERNAME");
    },
    setXP({ commit }, xp) {
      commit("SET_XP", xp);
    },
    increaseXP({ commit }, xp) {
      commit("INCREASE_XP", xp);
    },
  },
});
