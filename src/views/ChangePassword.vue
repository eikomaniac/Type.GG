<template>
  <div class="container">
    <b-alert variant="danger" :show="flashExpiredLink"
      >This link is invalid or has been expired.</b-alert
    >
    <div class="header">forgot password?</div>
    <div style="margin-bottom:25px;">
      enter your email to reset your password.
    </div>
    <b-form @submit="onSubmit">
      <b-form-group label="password:">
        <b-form-input
          v-model="form.password"
          :state="passValidation"
          type="password"
          required
        ></b-form-input>
        <b-form-invalid-feedback
          >password must contain at least 8 characters</b-form-invalid-feedback
        >
      </b-form-group>

      <b-form-group label="confirm password:">
        <b-form-input
          id="no-paste"
          v-model="form.confirmPassword"
          :state="confirmValidation"
          type="password"
          required
        ></b-form-input>
        <b-form-invalid-feedback
          >passwords don't match.</b-form-invalid-feedback
        >
      </b-form-group>

      <div style="text-align: center;">
        <b-button :disabled="disabled" type="submit" variant="primary"
          >submit</b-button
        >
      </div>
    </b-form>
  </div>
</template>

<script>
import axios from "axios";
// import { mapActions } from "vuex";

export default {
  name: "Login",
  data() {
    return {
      form: {
        password: "",
        confirmPassword: "",
      },
      error: "",
      flashExpiredLink: false,
    };
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault();
      axios
        .post(
          `http://api-type-gg.herokuapp.com/forgot-password/${this.$route.params.token}`,
          this.form
        )
        .then(
          (res) => {
            if (res.status === 200) {
              localStorage.setItem("flashPasswordChanged", true);
              this.$router.push("/login");
            }
          },
          (err) => {
            this.error = err.response.data.error;
          }
        );
    },
  },
  computed: {
    passValidation() {
      if (this.form.password === "") {
        return null;
      }
      return this.form.password.length >= 8;
    },
    confirmValidation() {
      if (this.form.confirmPassword === "") {
        return null;
      }

      return this.form.password === this.form.confirmPassword;
    },
    disabled() {
      return !(this.passValidation && this.confirmValidation);
    },
  },
  created() {
    if (localStorage.getItem("flashExpiredLink")) {
      this.flashExpiredLink = true;
      localStorage.removeItem("flashExpiredLink");
    }
  },
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
