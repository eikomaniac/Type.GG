<template>
  <div class="container">
    <b-alert variant="danger" :show="error.length > 0" v-text="error" />
    <div class="header">create an account</div>
    <div style="margin-bottom:25px;">
      this is the final step to creating your Type.GG account.
      <br />pick a username and password to complete your account sign-up process.
    </div>
    <b-form @submit="onSubmit">
      <b-form-group label="username:">
        <b-form-input :state="userValidation" v-model="form.username" type="text" required></b-form-input>
        <b-form-invalid-feedback>usernames may only contain A-Z, a-z, and 0-9 and must be between 4-12 characters.</b-form-invalid-feedback>
      </b-form-group>
      <hr />

      <b-form-group label="password:">
        <b-form-input v-model="form.password" :state="passValidation" type="password" required></b-form-input>
        <b-form-invalid-feedback>password must contain at least 8 characters</b-form-invalid-feedback>
      </b-form-group>

      <b-form-group label="confirm password:">
        <b-form-input
          id="no-paste"
          v-model="form.confirmPassword"
          :state="confirmValidation"
          type="password"
          required
        ></b-form-input>
        <b-form-invalid-feedback>passwords don't match.</b-form-invalid-feedback>
      </b-form-group>
      <hr />
      <div style="text-align: center;">
        <b-button :disabled="disabled" type="submit" variant="primary">complete sign up</b-button>
      </div>
    </b-form>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Confirmation",
  data() {
    return {
      form: {
        username: "",
        password: "",
        emailToken: "",
        confirmPassword: ""
      },
      error: ""
    };
  },
  computed: {
    userValidation() {
      let usernamePattern = new RegExp("^[0-9A-Za-z]+$");
      if (this.form.username.length === 0) {
        return null;
      }
      return (
        usernamePattern.test(this.form.username) &&
        this.form.username.length >= 4 &&
        this.form.username.length <= 12
      );
    },
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
      return !(
        this.userValidation &&
        this.passValidation &&
        this.confirmValidation
      );
    }
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault();
      axios.post("http://localhost:5000/confirmation", this.form).then(
        res => {
          if (res.status === 201) {
            localStorage.setItem("flashSignedUpOnLogin", true);
            this.$router.push("/login");
          }
        },
        err => {
          console.log(err);
          // this.error = err.response.data.error;
        }
      );
    }
  },
  created() {
    this.form.emailToken = this.$route.params.token;
  },
  mounted() {
    const confirmPasswordInput = document.getElementById("no-paste");
    confirmPasswordInput.onpaste = e => {
      e.preventDefault();
    };
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
  width: 500px;
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