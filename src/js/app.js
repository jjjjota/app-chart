import $ from "jquery";
import Vue from 'vue';
import VueChartJs from 'vue-chartjs';
import axios from 'axios';


// get current date
let date = new Date(),
    month = date.getMonth() + 2 + '', // we want until the last day of the current month, so +1
    year  = date.getFullYear() + '';

if ( month.length < 2 ) { month = '0' + month;} // fix format


// component
Vue.component("line-chart", {
  extends: VueChartJs.Line,
  props: ["values", "labels", "currency"],
  methods: {
    renderLineChart: function() {
    this.renderChart(
      { labels: this.labels,
        datasets:
          [{  label: "Valor " + this.currency +" en CLP",
              data: this.values,
              borderColor: "rgba(248, 77, 114, 1)",
              borderWidth: 3,
              backgroundColor: "rgba(248, 77, 114, 0.55)" }] },
      { responsive: true,
        maintainAspectRatio: false,
        elements:
          { line:
            { tension: 0 }}}  );   } //end method
  },
  watch: {
    labels: function() {
      this.renderLineChart();
    }
  }
});



// app
let app = new Vue({
  el: '#app',

  data () {
    return {
      uf        : 'UF',
      utm       : 'UTM',
      ufData    : null,
      utmData   : null,

      ufLabels  : null,
      utmLabels : null,
      ufRows    : null,
      utmRows   : null,

      fromDate  : null,
      untilDate : null,

      stats     : {
        averageUf  : null,
        minUf      : null,
        maxUf      : null,

        averageUtm : null,
        minUtm     : null,
        maxUtm     : null, },

      date      : {
        month : month,
        year  : year } }   }, // end data

  methods: {
    changeData: function() {
      this.dataChart = [6, 6, 3, 5, 5, 6]; },

    // function to get dates between
    filterDates: function(arr, currency) {
      // get from & until dates
      let fromDate  = this.fromDate.split('-'),  // date format YYYY-MM-DD
          untilDate = this.untilDate.split('-');

      // fix month number
      let fromMonth  = parseInt(fromDate[1]);
      let untilMonth = parseInt(untilDate[1]);
      if ( fromMonth <= 10 ) {
        fromDate[1] = '0' + (fromMonth - 1); }
      if ( untilMonth <= 10 ) {
        untilDate[1] = '0' + (untilMonth - 1); }

      // convert to date object
      fromDate  = new Date(fromDate[0], fromDate[1], fromDate[2]),
      untilDate = new Date(untilDate[0], untilDate[1], untilDate[2]);

      // check dates are valid
      if ( fromDate > untilDate ) {
        alert("La fecha ingresada en 'hasta' debe ser posterior");
        return; }

      // get dates from the given array
      let labels = [],
          rows   = [];

      arr.forEach( item => {
        let itemDate  = item['Fecha'].split('-');

        let month = parseInt(itemDate[1]);
        if ( month <= 10 ) {
          itemDate[1] = '0' + (month - 1); }

        // convert to date object
        itemDate  = new Date(itemDate[0], itemDate[1], itemDate[2]);

        if (fromDate <= itemDate && itemDate <= untilDate) {
          labels.push( item["Fecha"] );

          // fix number string to float
          let value = item["Valor"].replace('.', '').replace(',', '.');
          rows.push( parseFloat(value) ); }   }) // end forEach

      if ( currency === 'uf') {
        this.ufLabels = labels;
        this.ufRows   = rows; }

      else if ( currency === 'utm' ) {
        this.utmLabels = labels;
        this.utmRows   = rows; }   },

    getStats: function(arr) {
      let averageValue = 0,
          minValue     = 0,
          maxValue     = 0;

      if ( arr.length > 0 ) {
        // average
        let sum          = arr.reduce( (a,b) => a + b );

        averageValue = ( sum / arr.length ).toFixed(2);

        // min/max
        maxValue = 0,
        minValue = arr[0];

        arr.forEach( value => {
          if ( value < minValue ) {
            minValue = value }
            else if ( value > maxValue ) {
              maxValue = value } }); } // end if

      return {average: averageValue, min: minValue, max: maxValue}; },

    updateData: function() {
      this.filterDates(this.ufData, 'uf');
      this.filterDates(this.utmData, 'utm');

      // update stats
      let ufStats  = this.getStats(this.ufRows),
          utmStats = this.getStats(this.utmRows);

      this.stats.averageUf  = ufStats.average;
      this.stats.minUf      = ufStats.min;
      this.stats.maxUf      = ufStats.max;

      this.stats.averageUtm = utmStats.average;
      this.stats.minUtm     = utmStats.min;
      this.stats.maxUtm     = utmStats.max;

      // show stats
      $(".charts__info").css('visibility', 'visible');
      $( "html, body" ).animate(
        { scrollTop: $(".charts").offset().top - 50 }, 800 ); }   }, // end methods

  mounted () {
    // uf request
    // return dayly value
    axios
      .get(`https://api.sbif.cl/api-sbifv3/recursos_api/uf/anteriores/${this.date.year}/${this.date.month}?apikey=35426506ac58e76d0782e2800e619c60d396878e&formato=json`)
      .then(response => {
        this.ufData = response.data['UFs'] })
      .catch(error => {
        console.log(error)
        this.errored = true })
      .finally(() => this.loading = false)

    // utm request
    // return  monthly value
    axios
      .get(`https://api.sbif.cl/api-sbifv3/recursos_api/utm/anteriores/${this.date.year}/${this.date.month}?apikey=35426506ac58e76d0782e2800e619c60d396878e&formato=json`)
      .then(response => {
        this.utmData = response.data['UTMs'];
        $('button').addClass('active'); })
      .catch(error => {
        console.log(error)
        this.errored = true })
      .finally(() => this.loading = false)   } // end mounted
});
