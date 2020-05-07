<template>
  <div class="container">
    <b-alert variant="danger" :show="flashExpiredLink">This link is invalid or has been expired.</b-alert>
    <b-alert variant="danger" :show="error.length > 0">{{ error }}</b-alert>
    <b-alert
      variant="success"
      :show="success"
    >An email has been sent for a link to reset your password.</b-alert>
    <div class="header">forgot password?</div>
    <div style="margin-bottom:25px;">enter your email to reset your password.</div>
    <b-form @submit="onSubmit">
      <b-form-group label="email:">
        <b-form-input v-model="form.email" type="text" required></b-form-input>
      </b-form-group>

      <div style="text-align: center;">
        <b-button :disabled="disabled" type="submit" variant="primary">submit</b-button>
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
        email: ""
      },
      error: "",
      flashExpiredLink: false,
      success: false
    };
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault();
      axios.post("https://api-type-gg.tk/forgot-password", this.form).then(
        res => {
          if (res.status === 200) {
            this.success = true;
          } else {
            this.error = res.data.error;
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
      return !(this.form.email.length > 0);
    }
  },
  created() {
    if (localStorage.getItem("flashExpiredLink")) {
      this.flashExpiredLink = true;
      localStorage.removeItem("flashExpiredLink");
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
