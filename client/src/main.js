import Vue from "vue";
// import Vuex from 'vuex';
import BootstrapVue from "bootstrap-vue";
import VueRouter from "vue-router";
import App from "./App.vue";

import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue/dist/bootstrap-vue.css";

import store from "./store";

import Landing from "./views/Landing.vue";
import Register from "./views/Register.vue";
import Confirmation from "./views/Confirmation.vue";
import ForgotPassword from "./views/ForgotPassword.vue";
import ChangePassword from "./views/ChangePassword.vue";
import Rankings from "./views/Rankings.vue";
import Profile from "./views/Profile.vue";
import Login from "./views/Login.vue";
import Solo from "./views/Solo.vue";
import NotFound from "./views/NotFound.vue";
import axios from "axios";
import VueTimeago from "vue-timeago";
// const jwt = require("jsonwebtoken");

Vue.config.productionTip = false;

// Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(BootstrapVue);
Vue.use(VueTimeago, {
  name: "Timeago",
  locale: "en",
});

const router = new VueRouter({
  mode: "history",
  routes: [
    { path: "/", component: Landing, meta: { requiresAuth: true } },
    {
      name: "register",
      path: "/register",
      component: Register,
      meta: { requiresLoggedOut: true },
    },
    {
      name: "confirmation",
      path: "/confirmation/:token",
      component: Confirmation,
      beforeEnter: (to, from, next) => {
        axios
          .get(`http://localhost:5000/confirmation/${to.params.token}`)
          .then((response) => {
            if (!response.data.verified) {
              localStorage.setItem("flashExpiredLink", true);
              next({ name: "register" });
            }
          })
          .catch(() => {
            localStorage.setItem("flashExpiredLink", true);
            next({ name: "register" });
          });
        next();
      },
      meta: { requiresLoggedOut: true },
    },
    {
      path: "/confirmation",
      redirect: { name: "register" },
    },
    {
      name: "login",
      path: "/login",
      component: Login,
      meta: { requiresLoggedOut: true },
    },
    {
      name: "solo",
      path: "/solo",
      component: Solo,
      meta: { requiresAuth: true },
    },
    {
      name: "profile",
      path: "/profile",
      component: Profile,
    },
    {
      name: "change-password",
      path: "/forgot-password/:token",
      component: ChangePassword,
      beforeEnter: (to, from, next) => {
        axios
          .get(`http://localhost:5000/forgot-password/${to.params.token}`)
          .then((response) => {
            if (!response.data.verified) {
              localStorage.setItem("flashExpiredLink", true);
              next({ name: "forgot-password" });
            }
          })
          .catch(() => {
            localStorage.setItem("flashExpiredLink", true);
            next({ name: "forgot-password" });
          });
        next();
      },
    },
    {
      name: "forgot-password",
      path: "/forgot-password",
      component: ForgotPassword,
      meta: { requiresLoggedOut: true },
    },
    {
      name: "rankings",
      path: "/rankings",
      component: Rankings,
    },
    // { path: "/multi", component: Multi },
    // { path: "/users/:username", component: User },
    { name: "error", path: "*", component: NotFound },
  ],
});
router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!localStorage.getItem("token")) {
      next({ name: "login" });
    } else {
      next();
    }
  } else if (to.matched.some((record) => record.meta.requiresLoggedOut)) {
    if (localStorage.getItem("token")) {
      next("/");
    } else {
      next();
    }
  } else {
    next();
  }
});

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
