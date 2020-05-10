<template>
  <div>
    <div>
      <h3 v-if="!quoteFinished" style="display: inline-block;">WPM: {{ countdown &lt;= -1 ? Math.trunc(wpm) : 0 }}</h3>
      <h3 v-if="quoteFinished" style="display: inline-block;">WPM: {{ trunc2dp(wpm) }} |</h3> <h3 style="display: inline-block;" v-if="quoteFinished">Accuracy: {{ trunc2dp(accuracy) }}%</h3>
      <div style="float:right; display: inline-block">
        <span style="width: 50px; font-size: 1.25em; " v-if="countdown <= 0 && !quoteFinished">{{ time }}</span>
        <span :class="dot1colour"/> <span :class="dot2colour"/> <span :class="dot3colour"/>
      </div>
      <hr style="margin-top:-5px;" />
    </div>
    <div class="text-box" :class="greyedOutText" id="text-box">
      <span class="correctWords" v-if="correctWords" v-text="correctWords" /><span class="highlightedCorrect" v-if="highlightedCorrect" v-text="highlightedCorrect" /><span
        class="highlightedWrongInWord"
        v-if="highlightedWrongInWord"
        v-text="highlightedWrongInWord"
      /><span
        class="highlightedWrongAfter"
        v-if="highlightedWrongAfter"
        v-text="highlightedWrongAfter"
      /><span class="correctChars" v-if="correctChars" v-text="correctChars" /><span class="wrongCharsInWord" v-if="wrongCharsInWord" v-text="wrongCharsInWord" /><span class="wrongCharsAfter" v-if="wrongCharsAfter" v-text="wrongCharsAfter" /><span
        :class="[
          areIncompleteChars ? 'incompleteChars' : null,
          showCaret ? 'currentCharClass' : null,
        ]"
        v-text="currentChar"
      ></span><span class="incompleteChars" v-if="incompleteChars" v-text="incompleteChars.substring(1)"></span><span>{{areIncompleteChars ? this.remainingText : this.remainingText.substring(1)}}</span>
    </div>
    <b-progress striped :animated="true" :max="text.length">
      <b-progress-bar
        class="no-transition"
        :value="
          correctWords.length + correctChars.length + highlightedCorrect.length
        "
        variant="success"
      ><span style="font-size: 1.5em; text-align: right; margin-right: 2px; margin-top: 7px;">{{ quoteFinished ? trunc2dp(wpm) : Math.trunc(wpm) }}</span></b-progress-bar>
      <b-progress-bar
        class="no-transition"
        :value="
          wrongCharsInWord.length +
            wrongCharsAfter.length +
            highlightedWrongInWord.length +
            highlightedWrongAfter.length -
            this.charsAfter.length
        "
        variant="danger"
      ></b-progress-bar>
    </b-progress>
    <b-progress striped :animated="true" :max="text.length" v-if="pb.replayData">
      <b-progress-bar class="no-transition" :value="pbCorrectChars" variant="primary"><span style="font-size: 1.5em; text-align: right; margin-right: 2px; margin-top: 7px;">{{ quoteFinished ? trunc2dp(pbWPM) : Math.trunc(pbWPM) }}</span></b-progress-bar>
      <b-progress-bar
        class="no-transition"
        :value="
          pbCorrectChars + pbWrongChars > text.length
            ? text.length - pbCorrectChars
            : pbWrongChars
        "
        variant="danger"
      ></b-progress-bar>
    </b-progress>
    <div v-if="capsLockOn" class="alert alert-warning">Warning: Caps-Lock on</div>
    <div v-if="quoteFinished">
      Time: {{ Math.trunc(this.replayData[this.replayData.length - 1].time / 10) / 100}}s<br>
      Adjusted WPM: {{ trunc2dp(adjustedWPM) }}<br>
      <b-button variant="danger" @click="refresh">Retry (F5)</b-button>
      <b-button variant="primary" :to="{ name: 'solo' }">Next</b-button>
    </div>
    <line-chart v-if="pb.replayData" style="padding-right: 5px" :height="150" :chart-data="datacollection"></line-chart>
    <div v-if="pb.replayData" class="pb-container">
      <h3>Personal Best</h3>
      WPM: {{ trunc2dp(pb.wpm) }}
      <br />
      Accuracy: {{ trunc2dp(pb.accuracy) }}%
      <br />Achieved
      <timeago :datetime="pb.date" :autoUpdate="true"></timeago>
    </div>
  </div>
</template>

<script>
// import socketio from 'socket.io-client';
import axios from "axios";
import { mapGetters, mapActions } from "vuex";
import LineChart from "./LineChart.js";

export default {
  components: { LineChart },
  props: ["textId"],
  data() {
    return {
      datacollection: {},
      text: "",
      replayData: [],
      correctWords: "",
      correctChars: "",
      wrongCharsInWord: "",
      wrongCharsAfter: "",
      highlightedCorrect: "",
      highlightedWrongInWord: "",
      highlightedWrongAfter: "",
      incompleteChars: "",
      charsAfter: "",
      remainingText: "",
      capsLockOn: false,
      startingTime: 0,
      wpm: 0,
      accuracy: 0,
      totalErrors: 0,
      countdown: 3,
      caretStart: 0,
      showCaret: false,
      quoteFinished: false,
      wpmInterval: null,
      countdownInterval: null,
      replayTimeout: null,
      replayTimeoutActive: true,
      pb: {},
      pbWPM: 0,
      pbCorrectChars: 0,
      pbWrongChars: 0,
      correctCharsTyped: 0,
      timeoutQueue: []
    };
  },
  methods: {
    ...mapActions(["increaseXP"]),
    trunc2dp(val) {
      return (Math.trunc(val*100)/100).toFixed(2);
    },
    reconstructReplay() {
      let userInput = "";
      let errors = [];
      let lastSpaceIndex = 0;
      let errorCorrected = true;
      // let totalErrors = 0;
      let highlighted = false;
      // let correctCharsTyped = 0;
      let sectionWPMs = [];
      let sections = [];
      let sectionWords = "";
      let overallWPMs = [];
      let replaySpaceIndex = 0;
      let previousSectionSpaceIndex = 0;
      let firstSectionSpaceIndex = 0;

      // let wordWPMs = 0;
      // let words = 0;

      let minNoOfSections = 25;
      let charsPerSection = Math.ceil(this.text.length / minNoOfSections);
      // console.log(charsPerSection);
      if (this.replayData.length !== 0) {
        for (var i = 0; i < this.replayData.length; i++) {
          let char = this.replayData[i].key;
          if (highlighted) {
            if (char.length === 1) {
              userInput = userInput.substring(0, lastSpaceIndex);
              userInput += char;
              highlighted = false;
            } else if (char === "Backspace") {
              userInput = userInput.substring(0, lastSpaceIndex);
              highlighted = false;
            } else if (char === "Unhighlight") {
              highlighted = false;
            }
          } else {
            if (char.length === 1) {
              userInput += char;

              // If input is correct
              if (this.text.substring(0, userInput.length) === userInput) {
                // correctCharsTyped += 1;
                if (char === " ") {
                  let word = this.text.substring(
                    lastSpaceIndex,
                    userInput.length
                  );
                  // console.log(word);
                  if (sectionWords.length + word.length <= charsPerSection) {
                    sectionWords += word;
                  } else {
                    if (firstSectionSpaceIndex === 0) {
                      firstSectionSpaceIndex = replaySpaceIndex;
                    }
                    if (sectionWords !== "") {
                      sections.push(sectionWords);
                      overallWPMs.push(this.trunc2dp(
                        sections.join("").length /
                          5 /
                          (this.replayData[replaySpaceIndex].time / 1000 / 60)));
                      if (sections.length === 1) {
                        sectionWPMs.push(
                          this.trunc2dp(
                            sections.join("").length /
                              5 /
                              (this.replayData[replaySpaceIndex].time /
                                1000 /
                                60)));
                      } else {
                        sectionWPMs.push(
                          this.trunc2dp(
                            sections[sections.length - 1].length /
                              5 /
                              ((this.replayData[replaySpaceIndex].time -
                                this.replayData[previousSectionSpaceIndex]
                                  .time) /
                                1000 /
                                60)));
                      }
                    }
                    sectionWords = word;
                    previousSectionSpaceIndex = replaySpaceIndex;
                  }
                  lastSpaceIndex = userInput.length;
                  replaySpaceIndex = i;
                }
              } else if (errorCorrected) {
                // totalErrors += 1;
                errorCorrected = false;
              }
            } else {
              if (char === "CtrlBackspace") {
                userInput = userInput.substring(0, lastSpaceIndex);
              } else if (char === "Backspace") {
                userInput = userInput.substring(0, userInput.length - 1);
              } else if (char === "Highlight") {
                highlighted = true;
              } else if (char === "Unhighlight") {
                highlighted = false;
              } else {
                errors.push("Corrupt keys in replay");
              }
            }
          }
          if (
            (i > 0 && this.replayData[i].time <= this.replayData[i - 1].time) ||
            this.replayData[i].time < 0
          ) {
            errors.push("Corrupt time in replay");
          }
          if (errors.length > 0) {
            break;
          }
          if (this.text.substring(0, userInput.length) === userInput) {
            errorCorrected = true;
          }
        }
        sections.push(
          sectionWords + this.text.substring(lastSpaceIndex, userInput.length)
        );
        sectionWPMs.push(
          this.trunc2dp(
            sections[sections.length - 1].length /
              5 /
              ((this.replayData[this.replayData.length - 1].time -
                this.replayData[previousSectionSpaceIndex].time) /
                1000 /
                60)));
        overallWPMs.push(
          this.trunc2dp(
            this.text.length /
              5 /
              (this.replayData[this.replayData.length - 1].time / 1000 / 60)));
      }

      userInput = "";
      errors = [];
      lastSpaceIndex = 0;
      errorCorrected = true;
      // let totalErrors = 0;
      highlighted = false;
      // let correctCharsTyped = 0;
      sections = [];
      sectionWords = "";
      let PBoverallWPMs = [];
      replaySpaceIndex = 0;
      previousSectionSpaceIndex = 0;
      firstSectionSpaceIndex = 0;

      // let wordWPMs = 0;
      // let words = 0;
      // console.log(charsPerSection);
      for (i = 0; i < this.pb.replayData.length; i++) {
        let char = this.pb.replayData[i].key;
        if (highlighted) {
          if (char.length === 1) {
            userInput = userInput.substring(0, lastSpaceIndex);
            userInput += char;
            highlighted = false;
          } else if (char === "Backspace") {
            userInput = userInput.substring(0, lastSpaceIndex);
            highlighted = false;
          } else if (char === "Unhighlight") {
            highlighted = false;
          }
        } else {
          if (char.length === 1) {
            userInput += char;

            // If input is correct
            if (this.text.substring(0, userInput.length) === userInput) {
              // correctCharsTyped += 1;
              if (char === " ") {
                let word = this.text.substring(
                  lastSpaceIndex,
                  userInput.length
                );
                // console.log(word);
                if (sectionWords.length + word.length <= charsPerSection) {
                  sectionWords += word;
                } else {
                  if (firstSectionSpaceIndex === 0) {
                    firstSectionSpaceIndex = replaySpaceIndex;
                  }
                  if (sectionWords !== "") {
                    sections.push(sectionWords);
                    PBoverallWPMs.push(
                      this.trunc2dp(
                        sections.join("").length /
                          5 /
                          (this.pb.replayData[replaySpaceIndex].time /
                            1000 /
                            60)));
                  }
                  sectionWords = word;
                  previousSectionSpaceIndex = replaySpaceIndex;
                }
                lastSpaceIndex = userInput.length;
                replaySpaceIndex = i;
              }
            } else if (errorCorrected) {
              // totalErrors += 1;
              errorCorrected = false;
            }
          } else {
            if (char === "CtrlBackspace") {
              userInput = userInput.substring(0, lastSpaceIndex);
            } else if (char === "Backspace") {
              userInput = userInput.substring(0, userInput.length - 1);
            } else if (char === "Highlight") {
              highlighted = true;
            } else if (char === "Unhighlight") {
              highlighted = false;
            } else {
              errors.push("Corrupt keys in replay");
            }
          }
        }
        if (
          (i > 0 &&
            this.pb.replayData[i].time <= this.pb.replayData[i - 1].time) ||
          this.pb.replayData[i].time < 0
        ) {
          errors.push("Corrupt time in replay");
        }
        if (errors.length > 0) {
          break;
        }
        if (this.text.substring(0, userInput.length) === userInput) {
          errorCorrected = true;
        }
      }
      PBoverallWPMs.push(
        this.trunc2dp(
          this.text.length /
            5 /
            (this.pb.replayData[this.pb.replayData.length - 1].time /
              1000 /
              60))
      );
      sections.push(
        sectionWords + this.text.substring(lastSpaceIndex, userInput.length)
      );

      if (this.replayData.length !== 0) {
        this.datacollection = {
          labels: sections,
          datasets: [
            {
              label: "WPM",
              borderColor: "rgb(255, 99, 132)",
              showLine: false,
              pointRadius: 5,
              data: sectionWPMs
            },
            {
              label: "Adjusted 1st Segment",
              borderColor: "green",
              showLine: false,
              pointRadius: 5,
              data: [
                this.trunc2dp((sections[0].length-1) /
                  5 /
                  ((this.replayData[firstSectionSpaceIndex].time -
                    this.replayData[0].time) /
                    1000 /
                    60))]
            },
            {
              label: "Overall WPM",
              borderColor: "cyan",
              data: overallWPMs
            },
            {
              label: "PB Overall WPM",
              borderColor: "grey",
              data: PBoverallWPMs,
              fill: false
            }
          ]
        };
      } else {
        this.datacollection = {
          labels: sections,
          datasets: [
            {
              label: "WPM",
              borderColor: "rgb(255, 99, 132)"
            },
            {
              label: "Adjusted 1st Segment",
              borderColor: "green"
            },
            {
              label: "Overall WPM",
              borderColor: "cyan"
            },
            {
              label: "PB Overall WPM",
              borderColor: "grey",
              data: PBoverallWPMs,
              fill: false
            }
          ]
        };
      }
    },
    refresh: function() {
      clearInterval(this.wpmInterval);
      clearInterval(this.countdownInterval);
      clearTimeout(this.replayTimeout);
      this.replayTimeoutActive = false;
      for (var i = 0; i < this.timeoutQueue.length; i++) {
        clearTimeout(this.timeoutQueue[i]);
      }
      this.startingTime = new Date().getTime() + 3000;
      this.wpmInterval = setInterval(() => {
        if (
          this.highlightedCorrect.length === 0 &&
          this.highlightedWrongInWord.length === 0 &&
          this.highlightedWrongAfter.length === 0
        ) {
          this.showCaret =
            document.hasFocus() &&
            (new Date().getTime() - this.caretStart) % 1000 <= 500;
        }
        if (this.correctWords.length != this.text.length) {
          this.wpm = this.calculateWPM();
        } else {
          this.showCaret = false;
          clearInterval();
        }
      }, 100);
      this.countdownInterval = setInterval(() => {
        this.countdown -= 1;
        if (this.countdown > -1) {
          if (this.countdown === 0 && this.pb.replayData) {
            this.playReplay();
          }
        }
      }, 1000);
      this.remainingText = this.text;
      this.replayData = [];
      this.correctWords = "";
      this.correctChars = "";
      this.wrongCharsInWord = "";
      this.wrongCharsAfter = "";
      this.incompleteChars = "";
      this.highlightedCorrect = "";
      this.highlightedWrongInWord = "";
      this.highlightedWrongAfter = "";
      this.charsAfter = "";
      this.underlineNewWord();
      this.capsLockOn = false;
      this.wpm = 0;
      this.accuracy = 0;
      this.totalErrors = 0;
      this.countdown = 3;
      this.quoteFinished = false;
      this.pbCorrectChars = 0;
      this.pbWrongChars = 0;
      this.pbWPM = 0;
      this.correctCharsTyped = 0;
    },
    keyDownHandler: function(e) {
      console.log(e.key);
      if (
        e.keyCode === 8 || // backspace
        e.keyCode === 222 || // '
        e.keyCode === 191 || // /
        e.keyCode === 32 || // space
        e.keyCode === 65 || // a
        e.keyCode === 36 || // home
        e.keyCode === 37 || // left arrow
        e.keyCode === 38 || // up arrow
        e.keyCode === 39 || // right arrow
        e.keyCode === 116 // f5
      ) {
        e.preventDefault();
      }
      if (e.keyCode === 116) {
        this.refresh();
      }
      if (
        this.quoteFinished ||
        this.countdown > 0 ||
        (this.correctChars.length + this.wrongCharsInWord.length === 0 &&
          e.key === " " &&
          this.charsAfter.length !== 25)
      ) {
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // If the user typed a char
        if (
          this.charsAfter.length > 25 &&
          this.highlightedCorrect.length +
            this.highlightedWrongInWord.length +
            this.highlightedWrongAfter.length ===
            0
        ) {
          return;
        }
        this.replayData.push({
          key: e.key,
          time: new Date().getTime() - this.startingTime
        });
        this.caretStart = new Date().getTime();
        if (
          this.highlightedCorrect.length +
            this.highlightedWrongInWord.length +
            this.highlightedWrongAfter.length >
          0
        ) {
          this.backspace();
        }
        if (this.wrongCharsInWord.length > 0) {
          // If already incorrect
          this.typeWrongChar();
        } else if (e.key == this.incompleteChars[0]) {
          // If correct
          this.typeCorrectChar();
        } else if (
          this.incompleteChars.length == 0 &&
          e.key == " " &&
          this.wrongCharsAfter.length == 0
        ) {
          // If hit space after finishing word correctly
          this.remainingText = this.remainingText.substring(1);
          this.underlineNewWord();
          this.correctCharsTyped += 1;
        } else {
          // Otherwise must be wrong
          if (this.wrongCharsAfter.length == 0) {
            this.totalErrors += 1;
          }
          this.typeWrongChar();
        }
        if (this.correctWords.length != this.text.length) {
          this.wpm = this.calculateWPM();
          this.accuracy = this.calculateAccuracy();
        }
      } else {
        if (e.keyCode == 8) {
          // If backspace
          if (e.ctrlKey || e.metaKey) {
            if (
              this.correctChars.length + this.wrongCharsInWord.length !== 0 ||
              this.highlightedCorrect.length +
                this.highlightedWrongInWord.length >
                0
            ) {
              // If control key held down, delete until the start of the word
              this.replayData.push({
                key: "CtrlBackspace",
                time: new Date().getTime() - this.startingTime
              });
              let length =
                this.correctChars.length +
                this.wrongCharsInWord.length +
                this.wrongCharsAfter.length;
              for (var i = 0; i < length; i++) {
                this.backspace();
              }
            }
          } else {
            if (
              this.correctChars.length + this.wrongCharsInWord.length !== 0 ||
              this.highlightedCorrect.length +
                this.highlightedWrongInWord.length >
                0
            ) {
              this.replayData.push({
                key: "Backspace",
                time: new Date().getTime() - this.startingTime
              });
              this.backspace();
            }
          }
        }
        // If highlighted
        if (
          this.highlightedCorrect.length > 0 ||
          this.highlightedWrongInWord.length > 0 ||
          this.highlightedWrongAfter.length > 0
        ) {
          // If right arrow
          if (e.keyCode === 39 || e.keyCode === 40) {
            this.unhighlight();
          }
          // If ctrl + x
          if (e.keyCode === 88) {
            this.backspace();
          }
          // If the user typed a non-char
        } else if (e.shiftKey) {
          // If shift + home/up
          if (e.keyCode === 36 || e.keyCode === 38) {
            this.highlight();
          } else if (e.ctrlKey || e.metaKey) {
            // If ctrl + shift + left
            if (e.keyCode === 37) {
              this.highlight();
            }
          }
        } else if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
          // If ctrl + a
          this.highlight();
        }
      }
    },
    keyUpHandler: function(e) {
      this.capsLockOn = e.getModifierState("CapsLock");
    },
    focusHandler: function() {
      this.caretStart = new Date().getTime();
    },
    onFocusOutHandler: function() {
      // e
      // this.caretStart += 500;
      this.showCaret = false;
    },
    underlineNewWord: function() {
      // Reset existing colours
      this.correctWords = this.correctWords + this.correctChars;
      if (
        this.remainingText.length + this.incompleteChars.length !=
          this.text.length &&
        this.correctWords.length != this.text.length
      ) {
        this.correctWords += " ";
      }
      this.correctChars = "";
      // Find end of word-to-be-typed
      let i = this.remainingText.indexOf(" ");
      if (i == -1) {
        i = this.remainingText.length;
      }
      // Underline word
      this.incompleteChars = this.remainingText.substring(0, i);
      this.remainingText = this.remainingText.substring(i);
    },
    typeCorrectChar: function() {
      this.correctCharsTyped += 1;
      this.correctChars += this.incompleteChars[0];
      this.incompleteChars = this.incompleteChars.substring(1);
      // If final char
      if (this.remainingText.length == 0 && this.incompleteChars.length == 0) {
        this.correctWords = this.correctWords + this.correctChars;
        this.correctChars = "";
        this.showCaret = false;
        this.quoteFinished = true;

        clearTimeout(this.replayTimeout);
        this.replayTimeoutActive = false;
        for (var i = 0; i < this.timeoutQueue.length; i++) {
          clearTimeout(this.timeoutQueue[i]);
        }
        
        if (!this.pb.wpm || this.wpm > this.pb.wpm) {
          this.pb.replayData = this.replayData;
          this.pb.wpm = this.wpm;
          this.pb.accuracy = this.accuracy;
          this.pb.date = new Date();
          this.pbCorrectChars = 0;
          this.pbWrongChars = 0;
        }
        // this.increaseXP(res.data.text.length);
        this.reconstructReplay();

        this.wpm =
          ((this.correctWords.length + this.correctChars.length) /
            5 /
            (this.replayData[this.replayData.length - 1].time / 1000)) *
          60;
        axios
          .post(
            `https://api-type-gg.tk/replays`,
            {
              textId: this.textId,
              replayData: this.replayData,
              username: this.getUsername
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
              }
            }
          )
          .then(
            res => {
              console.log(res.status);
              // if (!this.pb.wpm || res.data.wpm > this.pb.wpm) {
              //   this.pb = res.data;
              //   this.pbCorrectChars = 0;
              //   this.pbWrongChars = 0;
              // }
              // // this.increaseXP(res.data.text.length);
              // this.reconstructReplay();
            },
            err => {
              if (err.response.status === 401) {
                localStorage.clear();
              }
              console.log(err.response);
              this.error = err.response.data.error;
            }
          );
      }
    },
    typeWrongChar: function() {
      if (this.remainingText.length != 0 || this.incompleteChars.length != 0) {
        if (this.incompleteChars.length == 0) {
          // If typing after current word
          this.wrongCharsAfter += this.remainingText[0];
          this.remainingText = this.remainingText.substring(1);
        } else {
          // If still typing current word
          this.wrongCharsInWord += this.incompleteChars[0];
          this.incompleteChars = this.incompleteChars.substring(1);
        }
      } else {
        if (
          this.incompleteChars.length == 0 &&
          this.correctWords.length !== this.text.length
        ) {
          // If typing past text length
          this.charsAfter += "•";
          this.wrongCharsAfter += "•";
          this.remainingText = this.remainingText.substring(1);
        }
      }
    },
    unhighlight: function() {
      this.replayData.push({
        key: "Unhighlight",
        time: new Date().getTime() - this.startingTime
      });
      this.correctChars += this.highlightedCorrect;
      this.wrongCharsInWord += this.highlightedWrongInWord;
      this.wrongCharsAfter += this.highlightedWrongAfter;
      this.highlightedCorrect = "";
      this.highlightedWrongInWord = "";
      this.highlightedWrongAfter = "";
    },
    highlight: function() {
      if (this.correctChars.length + this.wrongCharsInWord.length > 0) {
        this.replayData.push({
          key: "Highlight",
          time: new Date().getTime() - this.startingTime
        });
        this.highlightedCorrect += this.correctChars;
        this.highlightedWrongInWord += this.wrongCharsInWord;
        this.highlightedWrongAfter += this.wrongCharsAfter;
        this.correctChars = "";
        this.wrongCharsInWord = "";
        this.wrongCharsAfter = "";
        this.showCaret = false;
      }
    },
    backspace: function() {
      // Removing highlight
      if (
        this.highlightedCorrect.length > 0 ||
        this.highlightedWrongInWord.length > 0 ||
        this.highlightedWrongAfter.length > 0
      ) {
        this.incompleteChars =
          this.highlightedCorrect +
          this.highlightedWrongInWord +
          this.incompleteChars;
        let EOL = this.highlightedWrongAfter.indexOf("•");
        if (EOL === -1) {
          EOL = this.highlightedWrongAfter.length;
        }
        this.remainingText =
          this.highlightedWrongAfter.substring(0, EOL) + this.remainingText;
        this.highlightedCorrect = "";
        this.highlightedWrongInWord = "";
        this.highlightedWrongAfter = "";
        this.charsAfter = "";
      }
      // Removing depending on where user is backspacing from
      if (this.charsAfter.length > 0) {
        this.charsAfter = this.charsAfter.substring(
          0,
          this.charsAfter.length - 1
        );
        this.wrongCharsAfter = this.wrongCharsAfter.substring(
          0,
          this.wrongCharsAfter.length - 1
        );
      } else if (this.wrongCharsAfter.length > 0) {
        this.remainingText =
          this.wrongCharsAfter[this.wrongCharsAfter.length - 1] +
          this.remainingText;
        this.wrongCharsAfter = this.wrongCharsAfter.substring(
          0,
          this.wrongCharsAfter.length - 1
        );
      } else if (this.wrongCharsInWord.length > 0) {
        this.incompleteChars =
          this.wrongCharsInWord[this.wrongCharsInWord.length - 1] +
          this.incompleteChars;
        this.wrongCharsInWord = this.wrongCharsInWord.substring(
          0,
          this.wrongCharsInWord.length - 1
        );
      } else if (this.correctChars.length > 0) {
        this.incompleteChars =
          this.correctChars[this.correctChars.length - 1] +
          this.incompleteChars;
        this.correctChars = this.correctChars.substring(
          0,
          this.correctChars.length - 1
        );
      }
    },
    calculateWPM() {
      return (
        ((this.correctWords.length + this.correctChars.length) /
          5 /
          ((new Date().getTime() - this.startingTime) / 1000)) *
        60
      );
    },
    calculateAccuracy() {
      return (
        (this.correctCharsTyped / (this.correctCharsTyped + this.totalErrors)) *
        100
      );
    },
    playCharInReplay(i) {
      this.timeoutQueue.push(
        setTimeout(() => {
          let char = this.pb.replayData[i].key;
          if (this.pb.highlighted) {
            if (char.length === 1) {
              this.pb.userInput = this.pb.userInput.substring(
                0,
                this.pb.lastSpaceIndex
              );
              this.pb.userInput += char;
              this.pb.highlighted = false;
            } else if (char === "Backspace") {
              this.pb.userInput = this.pb.userInput.substring(
                0,
                this.pb.lastSpaceIndex
              );
              this.pb.highlighted = false;
            } else if (char === "Unhighlight") {
              this.pb.highlighted = false;
            }
          } else {
            if (char.length === 1) {
              this.pb.userInput += char;

              // If input is correct
              if (
                this.text.substring(0, this.pb.userInput.length) ===
                this.pb.userInput
              ) {
                if (char === " ") {
                  this.pb.lastSpaceIndex = this.pb.userInput.length;
                }
              }
            } else {
              if (char === "CtrlBackspace") {
                this.pb.userInput = this.pb.userInput.substring(
                  0,
                  this.pb.lastSpaceIndex
                );
              } else if (char === "Backspace") {
                this.pb.userInput = this.pb.userInput.substring(
                  0,
                  this.pb.userInput.length - 1
                );
              } else if (char === "Highlight") {
                this.pb.highlighted = true;
              } else if (char === "Unhighlight") {
                this.pb.highlighted = false;
              }
            }
          }
          if (this.text.substring(0, this.pb.userInput.length) === this.pb.userInput) {
            this.pbCorrectChars = this.pb.userInput.length;
            this.pbWrongChars = 0;
          } else if (char.length === 1) {
            this.pbWrongChars += 1;
          }
          this.pbWPM = (this.pbCorrectChars / 5 / (this.pb.replayData[i].time / 1000 / 60))
        }, this.pb.replayData[i].time)
      );
    },
    playReplay() {
      this.pbCorrectChars = 0;
      this.pbWrongChars = 0;
      this.pb.userInput = "";
      this.pb.highlighted = false;
      this.pb.lastSpaceIndex = 0;
      this.replayTimeoutActive = true;
      this.timeoutQueue = [];
      for (var i = 0; i < this.pb.replayData.length; i++) {
        if (this.replayTimeoutActive) {
          this.playCharInReplay(i);
        } else {
          this.timeoutQueue = [];
          return;
        }
      }
    }
  },
  computed: {
    ...mapGetters(["getUsername"]),
    areIncompleteChars() {
      return this.incompleteChars.length > 0;
    },
    time() {
      let minutes = Math.floor(-this.countdown / 60);
      let seconds = (-this.countdown) % 60;
      let digit0 = "";
      if (seconds <= 9) {
        digit0 = "0"
      }
      return minutes + ":" + digit0 + seconds;
    },
    greyedOutText() {
      if (this.countdown > 0) {
        return "greyed-out-text"
      }
      return null;
    },
    currentChar() {
      return this.incompleteChars.length > 0
        ? this.incompleteChars[0]
        : this.remainingText[0];
    },
    adjustedWPM() {
      return (
        ((this.correctWords.length + this.correctChars.length - 1) /
          5 /
          ((this.replayData[this.replayData.length-1].time - this.replayData[0].time) / 1000)) *
        60
      );
    },
    dot1colour() {
      if (this.countdown > 0) {
        return "dot red";
      } else if (this.countdown <= -1) {
        return "dot grey";
      }
      return "dot green";
    },
    dot2colour() {
      if (this.countdown > 2 || this.countdown <= -1) {
        return "dot grey";
      } else if (this.countdown === 0) {
        return "dot green";
      }
      return "dot red";
    },
    dot3colour() {
      if (this.countdown > 1 || this.countdown <= -1) {
        return "dot grey";
      } else if (this.countdown <= 0) {
        return "dot green";
      }
      return "dot red";
    }
  },
  created: function() {
    // ! make better back-end calls
    axios.get(`https://api-type-gg.tk/texts/${this.textId}`).then(res => {
      this.text = res.data.text;
      this.remainingText = this.text;
      this.underlineNewWord();
      axios
        .get(
          `https://api-type-gg.tk/replays/?q={"username":"${this.getUsername}","isPB":"true","textId":"${this.textId}"}`
        )
        .then(res => {
          if (res.data[0]) {
            this.pb = res.data[0];
            this.pbCorrectChars = 0;
            this.pbWrongChars = 0;
          }
          this.reconstructReplay();
        })
        .catch(err => console.log(err));
    });
  },
  mounted: function() {
    let self = this;
    let d = new Date();
    this.startingTime = d.getTime() + 3000;
    this.wpmInterval = setInterval(() => {
      if (
        self.highlightedCorrect.length === 0 &&
        self.highlightedWrongInWord.length === 0 &&
        self.highlightedWrongAfter.length === 0
      ) {
        self.showCaret =
          document.hasFocus() &&
          (new Date().getTime() - self.caretStart) % 1000 <= 500;
      }
      if (self.correctWords.length != self.text.length) {
        self.wpm = self.calculateWPM();
      } else {
        self.showCaret = false;
      }
    }, 100);
    this.countdownInterval = setInterval(() => {
      self.countdown -= 1;
      if (self.countdown > -1) {
        if (self.countdown === 0 && this.pb.replayData) {
          this.playReplay();
        }
      }
    }, 1000);
    window.addEventListener("keydown", self.keyDownHandler);
    window.addEventListener("keyup", self.keyUpHandler);
    window.addEventListener("focus", self.focusHandler);
    window.addEventListener("onfocusout", self.onFocusOutHandler);
  }
};
</script>

<style scoped>
hr {
  border: 1px solid #363636;
  margin-top: 10px;
}

.dot {
  height: 25px;
  width: 25px;
  display: inline-block;
  border-radius: 50%;
}

.red {
  background-color: #cc0000;
}

.grey {
  background-color: #bbb;
}

.green {
  background-color: lime;
}

.greyed-out-text {
  color: silver;
}

.text-box {
  line-height: 1.2;
  /* height: 3em; */
  margin-bottom: 25px;
  white-space: pre-wrap;
  /* toggle by removing */ /* scroll-behavior: smooth; */
  /* overflow-y: hidden; */
  font-size: 1.25em;
  font-family: Consolas, "Source Code Pro", monospace;
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Old versions of Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently
                                  supported by Chrome, Opera and Firefox */
  /* cursor: not-allowed; */
}
.correctWords {
  color: #99cc00;
}
.correctChars {
  color: #99cc00;
  text-decoration: underline;
}
.wrongCharsInWord {
  background-color: darkred;
  text-decoration: underline;
}
.wrongCharsAfter {
  background-color: darkred;
}

.highlightedCorrect {
  background-color: #0d6bdc;
  color: #99cc00;
  text-decoration: underline;
}

.highlightedWrongInWord {
  background-color: #0d6bdc;
  color: darkred;
  text-decoration: underline;
}

.highlightedWrongAfter {
  background-color: #0d6bdc;
  color: darkred;
}

.currentCharClass {
  border-left: 1px solid white;
  margin-left: -1px;
}
.incompleteChars {
  text-decoration: underline;
}

.pb-container {
  background-color: rgb(48, 46, 57);
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
  margin-top: 25px;
  padding: 25px;
  text-align: left;
}

.no-transition {
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -ms-transition: none !important;
  -o-transition: none !important;
  transition: none !important;
}
</style>
