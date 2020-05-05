<template>
  <div class="container">
    <b-alert variant="danger" :show="flashExpiredLink">This link is invalid or has been expired.</b-alert>
    <b-alert variant="danger" :show="error.length > 0" v-text="error" />
    <b-alert
      variant="success"
      :show="success"
    >A confirmation email has been sent to {{ emailSubmitted }}, please check your email box.</b-alert>
    <div class="header">create an account</div>
    <b-form @submit="onSubmit">
      <b-form-group
        label="email address:"
        description="we'll never share your email with anyone else."
      >
        <b-form-input v-model="form.email" type="email" required></b-form-input>
      </b-form-group>

      <b-form-group
        label="confirm email address:"
        description="type.gg will send a confirmation email to this account. please follow the link in the mail to verify your email account."
      >
        <b-form-input
          id="no-paste"
          v-model="form.confirmEmail"
          :state="validation"
          type="email"
          required
        ></b-form-input>

        <b-form-invalid-feedback>email doesn't match.</b-form-invalid-feedback>
      </b-form-group>
      <hr />
      <div style="text-align: center;">
        <vue-recaptcha
          @verify="onVerify"
          @expired="onExpired"
          style="display: inline-block;"
          sitekey="6Lf2QO4UAAAAAPxr4eXqooVw1VAyDyu3buZ8hhor"
        ></vue-recaptcha>
      </div>
      <hr />
      <div style="text-align: center;">
        <b-button :disabled="disabled" type="submit" variant="primary">continue</b-button>
      </div>
    </b-form>
  </div>
</template>

<script>
import VueRecaptcha from "vue-recaptcha";
import axios from "axios";

export default {
  name: "Register",
  data() {
    return {
      form: {
        email: "",
        confirmEmail: "",
        captcha: ""
      },
      emailSubmitted: "",
      flashExpiredLink: false,
      success: false,
      error: ""
    };
  },
  components: { VueRecaptcha },
  computed: {
    validation() {
      if (this.form.confirmEmail === "") {
        return null;
      }
      return this.form.email === this.form.confirmEmail;
    },
    disabled() {
      return !this.validation || this.form.captcha === "" || this.success;
    }
  },
  methods: {
    onVerify(res) {
      this.form.captcha = res;
    },
    onExpired() {
      this.form.captcha = "";
    },
    onSubmit(evt) {
      evt.preventDefault();
      this.emailSubmitted = this.form.email;
      axios.post("http://localhost:5000/register", this.form).then(
        res => {
          console.log(res);
          if (res.data.success) {
            this.success = true;
          } else {
            this.error = res.data.error;
          }
        },
        err => {
          console.log(err);
        }
      );
    }
  },
  created() {
    if (localStorage.getItem("flashExpiredLink")) {
      this.flashExpiredLink = true;
      localStorage.removeItem("flashExpiredLink");
    }
  },
  mounted() {
    const confirmEmailInput = document.getElementById("no-paste");
    confirmEmailInput.onpaste = e => {
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

.text-muted {
  outline: 0;
}

hr {
  border: 1px solid #363636;
  margin-top: 10px;
}
</style>