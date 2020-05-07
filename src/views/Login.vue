<template>
  <div class="container">
    <b-alert variant="danger" :show="error.length > 0" v-text="error" />
    <b-alert
      variant="success"
      :show="flashSignedUpOnLogin"
    >Your account has successfully been created!</b-alert>
    <b-alert
      variant="success"
      :show="flashPasswordChanged"
    >Your password has successfully been changed!</b-alert>
    <div class="header">sign in</div>
    <b-form @submit="onSubmit">
      <b-form-group label="username:">
        <b-form-input v-model="form.username" type="text" required></b-form-input>
        <b-form-invalid-feedback>
          usernames may only contain A-Z, a-z, and 0-9 and must be between 4-12
          characters.
        </b-form-invalid-feedback>
      </b-form-group>

      <b-form-group label="password:">
        <b-form-input v-model="form.password" type="password" required></b-form-input>
        <b-form-invalid-feedback>password must contain at least 6 characters</b-form-invalid-feedback>
      </b-form-group>
      <div style="text-align: center;">
        <b-button :disabled="disabled" type="submit" variant="primary">sign in</b-button>
        <hr />
        <router-link to="forgot-password">Forgot your password?</router-link>
        <div>
          Don't have an account?
          <router-link to="register">Register</router-link>
        </div>
      </div>
    </b-form>
  </div>
</template>

<script>
import axios from "axios";
import { mapActions } from "vuex";

export default {
  name: "Login",
  data() {
    return {
      form: {
        username: "",
        password: ""
      },
      error: "",
      flashSignedUpOnLogin: false,
      flashPasswordChanged: false
    };
  },
  methods: {
    ...mapActions(["declareUsername"]),
    onSubmit(evt) {
      evt.preventDefault();
      axios.post("https://api-type-gg.tk/login", this.form).then(
        res => {
          if (res.status === 200) {
            localStorage.setItem("token", res.data.token);
            this.declareUsername(this.form.username);
            this.$router.push("/");
          }
        },
        err => {
          this.error = err.response.data.error;
        }
      );
    }
  },
  computed: {
    disabled() {
      return !(this.form.username.length > 0);
    }
  },
  created() {
    if (localStorage.getItem("flashSignedUpOnLogin")) {
      this.flashSignedUpOnLogin = true;
      localStorage.removeItem("flashSignedUpOnLogin");
    }
    if (localStorage.getItem("flashPasswordChanged")) {
      this.flashPasswordChanged = true;
      localStorage.removeItem("flashPasswordChanged");
    }
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
  text-align: left;
  width: 350px;
}

.header {
  text-align: center;
  font-size: 2em;
  margin-bottom: 10px;
}

hr {
  border: 1px solid #363636;
  margin-top: 10px;
}
</style>
