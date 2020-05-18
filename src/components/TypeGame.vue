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
      ctrlBackspaceIndexes: [],
      pbWPM: 0,
      pbCorrectChars: 0,
      pbWrongChars: 0,
      correctCharsTyped: 0,
      timeoutQueue: [],
      wordTyped: true,
      replayTextArray: [],
      replayInput: 0
    };
  },
  methods: {
    ...mapActions(["increaseXP"]),
    trunc2dp(val) {
      return (Math.trunc(val*100)/100).toFixed(2);
    },
    reconstructReplay() {
      let textArray = this.text.split(" ").map(x => x + " ");
      textArray[textArray.length-1] = textArray[textArray.length-1].substring(0, textArray[textArray.length-1].length-1);
      
      let segments = [];
      let segment = "";
      for (var i = 0; i < textArray.length; i++) {
        segment += textArray[i];
        if (segment.length > this.text.length / 25) {
          segments.push(segment);
          segment = "";
        }
      }
      if (segment !== "") {
        segments.push(segment);
      }

      let errorCorrected = true;
      let wordTyped = true;
      let segmentInput = "";
      let segmentIndex = 0;
      let PBsegmentWPMs = [];
      let lastSegmentTime = 0;
      let PBoverallWPMs = [];

      for (i = 0; i < this.pb.replayData.length; i++) {
        let input = this.pb.replayData[i].input;

        if (input === textArray[0]) {
          segmentInput += input;
          textArray.shift();
          wordTyped = true;
          if (segmentInput === segments[segmentIndex]) {
            PBoverallWPMs.push(this.trunc2dp(segments.slice(0,segmentIndex+1).join("").length / 5 / (this.pb.replayData[i].time / 60 / 1000)));
            PBsegmentWPMs.push(this.trunc2dp(segmentInput.length / 5 / ((this.pb.replayData[i].time - lastSegmentTime) / 60 / 1000)));
            segmentIndex += 1;
            segmentInput = "";
            lastSegmentTime = this.pb.replayData[i].time;
          } 
        } else if (input === textArray[0].substring(0, input.length)) {
            if (wordTyped || (i > 0 && input.length > this.pb.replayData[i-1].input.length)) {
              wordTyped = false;
              errorCorrected = true;
            }
        } else if (errorCorrected) {
          errorCorrected = false;
        }
      }

      let segmentWPMs = [null];
      let overallWPMs = [null];
      let adjustedFirstSegment = [null];

      if (this.replayData[0]) {
        textArray = this.text.split(" ").map(x => x + " ");
        textArray[textArray.length-1] = textArray[textArray.length-1].substring(0, textArray[textArray.length-1].length-1);
        
        segmentWPMs = [];
        overallWPMs = [];
        
        errorCorrected = true;
        wordTyped = true;
        segmentInput = "";
        segmentIndex = 0;
        lastSegmentTime = 0;
  
        for (i = 0; i < this.replayData.length; i++) {
          let input = this.replayData[i].input;
  
          if (input === textArray[0]) {
            segmentInput += input;
            textArray.shift();
            wordTyped = true;
            if (segmentInput === segments[segmentIndex]) {
              overallWPMs.push(this.trunc2dp(segments.slice(0,segmentIndex+1).join("").length / 5 / (this.replayData[i].time / 60 / 1000)));
              segmentWPMs.push(this.trunc2dp(segments[segmentIndex].length / 5 / ((this.replayData[i].time - lastSegmentTime) / 60 / 1000)));
              segmentIndex += 1;
              segmentInput = "";
              lastSegmentTime = this.replayData[i].time;
              if (segmentIndex === 1) {
                adjustedFirstSegment = [this.trunc2dp(
                  segments[0].length / 5 / ((this.replayData[i].time - this.replayData[0].time) / 60 / 1000)
                )];
              }
            } 
          } else if (input === textArray[0].substring(0, input.length)) {
              if (wordTyped || (i > 0 && input.length > this.replayData[i-1].input.length)) {
                wordTyped = false;
                errorCorrected = true;
              }
          } else if (errorCorrected) {
            errorCorrected = false;
          }
        }
      }

      this.datacollection = {
        labels: segments,
        datasets: [
          {
            label: "Segment WPM",
            borderColor: "rgb(255, 99, 132)",
            showLine: false,
            pointRadius: 5,
            data: segmentWPMs
          },
          {
            label: "Overall WPM",
            borderColor: "cyan",
            data: overallWPMs
          },
          {
            label: "Adjusted 1st Segment",
            borderColor: "green",
            showLine: false,
            pointRadius: 5,
            data: adjustedFirstSegment
          },
          {
            label: "PB Segment WPM",
            borderColor: "grey",
            showLine: false,
            hidden: true,
            pointRadius: 4,
            data: PBsegmentWPMs
          },
          {
            label: "Overall PB WPM",
            borderColor: "grey",
            data: PBoverallWPMs,
            fill: false
          },
        ]
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
      this.replayTextArray = this.text.split(" ").map(x => x + " ");
      this.replayTextArray[this.replayTextArray.length-1] = this.replayTextArray[this.replayTextArray.length-1].substring(0, this.replayTextArray[this.replayTextArray.length-1].length-1);
      this.replayInput = 0;
    },
    keyDownHandler: function(e) {
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
        this.caretStart = new Date().getTime();
        if (
          this.highlightedCorrect.length +
            this.highlightedWrongInWord.length +
            this.highlightedWrongAfter.length >
          0
        ) {
          this.backspace();
          this.replayData.push({ input: "", time: new Date().getTime() - this.startingTime });
        }

        if (this.wrongCharsInWord.length > 0) {
          // If already incorrect
          this.typeWrongChar(e.key);
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
          this.typeWrongChar(e.key);
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
              this.correctChars.length + this.wrongCharsInWord.length !== 0// &&
              // this.highlightedCorrect.length +
              //   this.highlightedWrongInWord.length >
              //   0
            ) {
              // If control key held down, ctrl backspace.
              let length =
                this.correctChars.length +
                this.wrongCharsInWord.length +
                this.wrongCharsAfter.length;

              let index;
              if (this.ctrlBackspaceIndexes.length === 0) {
                index = 0;
              } else {
                index = this.ctrlBackspaceIndexes[this.ctrlBackspaceIndexes.length-1];
              }

              for (var i = 0; i < length-index; i++) {
                this.backspace();
              }
              
              // let lastNum = this.ctrlBackspaceIndexes[this.ctrlBackspaceIndexes.length-1];
              // let secondLastNum = this.ctrlBackspaceIndexes[this.ctrlBackspaceIndexes.length-2];
              // while (secondLastNum + 1 === lastNum) {
              //   this.ctrlBackspaceIndexes.pop();
              //   lastNum = this.ctrlBackspaceIndexes[this.ctrlBackspaceIndexes.length-1];
              //   secondLastNum = this.ctrlBackspaceIndexes[this.ctrlBackspaceIndexes.length-2];
              // }
              this.replayData.push({ input: "", time: new Date().getTime() - this.startingTime });
            }
          } else {
            if (
              this.highlightedCorrect.length +
                this.highlightedWrongInWord.length >
                0
            ) {
              this.backspace();
              this.replayData.push({ input: "", time: new Date().getTime() - this.startingTime });
            } else if (this.correctChars.length + this.wrongCharsInWord.length !== 0) {
              this.backspace();
              this.replayData.push({ input: this.replayData[this.replayData.length-1].input.substring(0, this.replayData[this.replayData.length-1].input.length-1), time: new Date().getTime() - this.startingTime });
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
            this.replayData.push({ input: this.replayData[this.replayData.length-1].input.substring(0, this.replayData[this.replayData.length-1].input.length-1), time: new Date().getTime() - this.startingTime });
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
      let index = (this.correctChars + this.wrongCharsInWord + this.wrongCharsAfter).length - 1;
      if (e.key.match(/^[a-zA-Z0-9]$/g)) {
        if (this.replayData[0] && (this.replayData[this.replayData.length - 2].input !== "" && !this.replayData[this.replayData.length - 2].input.substring(this.replayData[this.replayData.length - 2].input.length-1, this.replayData[this.replayData.length - 2].input.length).match(/^[a-zA-Z0-9]$/g))) {
          this.ctrlBackspaceIndexes.push(index);
        }
      }
      console.log(this.ctrlBackspaceIndexes);
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
      this.wordTyped = true;
      this.ctrlBackspaceIndexes = [];
      // Reset existing colours
      this.correctWords = this.correctWords + this.correctChars;
      if (
        this.remainingText.length + this.incompleteChars.length !=
          this.text.length &&
        this.correctWords.length != this.text.length
      ) {
        this.correctWords += " ";
      }
      let time = new Date().getTime() - this.startingTime;
      if (time > 0) {
        this.replayData.push({ input: this.correctChars + " ", time });
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
      this.wordTyped = false;
      this.correctCharsTyped += 1;
      this.correctChars += this.incompleteChars[0];
      this.incompleteChars = this.incompleteChars.substring(1);
      // If final char
      if (this.remainingText.length == 0 && this.incompleteChars.length == 0) {
        this.correctWords = this.correctWords + this.correctChars;
        this.replayData.push({ input: this.correctChars, time: new Date().getTime() - this.startingTime });
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
        // this.increaseXP(this.text.length);
        this.reconstructReplay();

        this.wpm =
          ((this.correctWords.length + this.correctChars.length) /
            5 /
            (this.replayData[this.replayData.length - 1].time / 1000)) *
          60;
        axios.post(
          `https://api-type-gg.tk/replays`,
          // `http://localhost:5000/replays`,
          {
            textId: this.textId,
            replayData: this.replayData,
            username: this.getUsername
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }).then(
            res => {
              console.log(res.status);
              if (!this.pb.wpm || res.data.wpm > this.pb.wpm) {
                this.pb = res.data;
                this.pbCorrectChars = 0;
                this.pbWrongChars = 0;
              }
              this.reconstructReplay();
            },
            err => {
              if (err.response.status === 401) {
                localStorage.clear();
              }
              console.log(err.response);
              this.error = err.response.data.error;
            }
          );
      } else {
        this.replayData.push({ input: this.correctChars, time: new Date().getTime() - this.startingTime });
      }
    },
    typeWrongChar: function(key) {
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
      if (!this.wordTyped ) {
        this.replayData.push({ input: this.replayData[this.replayData.length-1].input + key, time: new Date().getTime() - this.startingTime });
      } else {
        this.replayData.push({ input: key, time: new Date().getTime() - this.startingTime });  
      }
      this.wordTyped = false;
    },
    unhighlight: function() {
      this.correctChars += this.highlightedCorrect;
      this.wrongCharsInWord += this.highlightedWrongInWord;
      this.wrongCharsAfter += this.highlightedWrongAfter;
      this.highlightedCorrect = "";
      this.highlightedWrongInWord = "";
      this.highlightedWrongAfter = "";
      if (this.replayData.length > 0) {
        this.replayData.push({ input: this.replayData[this.replayData.length-1].input, time: new Date().getTime() - this.startingTime });
      }
    },
    highlight: function() {
      if (this.correctChars.length + this.wrongCharsInWord.length > 0) {
        this.highlightedCorrect += this.correctChars;
        this.highlightedWrongInWord += this.wrongCharsInWord;
        this.highlightedWrongAfter += this.wrongCharsAfter;
        this.correctChars = "";
        this.wrongCharsInWord = "";
        this.wrongCharsAfter = "";
        this.showCaret = false;
        if (this.replayData.length > 0) {
          this.replayData.push({ input: this.replayData[this.replayData.length-1].input, time: new Date().getTime() - this.startingTime, highlighted: true });
        }
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
      if ((this.correctChars + this.wrongCharsInWord + this.wrongCharsAfter).length <= this.ctrlBackspaceIndexes[this.ctrlBackspaceIndexes.length - 1]) {
        this.ctrlBackspaceIndexes.pop();
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
    playInputInReplay(i) {
      this.timeoutQueue.push(
        setTimeout(() => {
          let input = this.pb.replayData[i].input;
          let correctChars = 0;
          let wrongChars = 0;
          for (var j = 0; j < input.length; j++) {
            if (input.substring(0, j) === this.replayTextArray[0].substring(0, j)) {
              correctChars += 1;
            } else {
              wrongChars += 1;
            }
          }
          this.pbCorrectChars = this.replayInput + correctChars;
          this.pbWrongChars = wrongChars;
          this.pbWPM = this.pbCorrectChars / 5 / (this.pb.replayData[i].time / 60 / 1000) 
          if (input === this.replayTextArray[0]) {
            this.replayInput += this.replayTextArray.shift().length;
          }
        },
        this.pb.replayData[i].time)
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
          this.playInputInReplay(i);
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
        ((this.text.length) /
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
          `https://api-type-gg.tk/replays/?q={"username":"${this.getUsername}","textId":"${this.textId}"}`
        )
        .then(res => {
          console.log(res);
          if (res.data[0]) {
            this.pb = res.data[0];
            this.pbCorrectChars = 0;
            this.pbWrongChars = 0;
            this.replayTextArray = this.text.split(" ").map(x => x + " ");
            this.replayTextArray[this.replayTextArray.length-1] = this.replayTextArray[this.replayTextArray.length-1].substring(0, this.replayTextArray[this.replayTextArray.length-1].length-1);
            this.replayInput = 0;
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
  border-bottom: 1px solid white;
}
.wrongCharsInWord {
  background-color: darkred;
  border-bottom: 1px solid white;
}
.wrongCharsAfter {
  background-color: darkred;
}

.highlightedCorrect {
  background-color: #0d6bdc;
  color: #99cc00;
  border-bottom: 1px solid white;
}

.highlightedWrongInWord {
  background-color: #0d6bdc;
  color: darkred;
  border-bottom: 1px solid white;
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
  border-bottom: 1px solid white;
  margin-top: -5px;
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
