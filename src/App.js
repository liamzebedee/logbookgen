import React, { Component } from 'react';
import moment from 'moment';

const GMAPS_KEY = "AIzaSyD2zdFUHYB3wWFNJ7BWT0pHDKppP4Bk6tE";

let gmapsApiLink = (origin, destination, units, departure_time) => `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&units=${units}&departure_time=${departure_time}&key=${GMAPS_KEY}`;


const LOGBOOK_HEADERS = `Date
From suburb
Odometer start
To suburb
Odometer end
Start time
Finish time
Total mins
Daytime
Nightime`.split('\n');




const TIMEFORMAT = "HH:mm";
const DATEFORMAT = "YYYY-MM-DD";

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

class SwagDog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      odometer: 0,

      moveToNextDay: false,


      fromSub: "Newtown",
      toSub: "Chippendale",
      entryDate: moment(),
      entryTime: moment(),


      results: []
    }

    this._addResult = this._addResult.bind(this)
    this.addEntry = this.addEntry.bind(this)
    this.exportJson = this.exportJson.bind(this)
    this.advance2to5Days = this.advance2to5Days.bind(this)
    this.advance7to20Days = this.advance7to20Days.bind(this)
    this.returnJourney = this.returnJourney.bind(this)
  }

  _addResult(res) {
    this.setState({ 
      results: this.state.results.concat([res]), 
      odometer: res.odometerEnd, 
      entryTime: res.endTime
    })
  }

  addEntry() {
    var request = {
      origin: `${this.state.fromSub} Australia`,
      destination: `${this.state.toSub} Australia`,
      travelMode: google.maps.TravelMode.DRIVING,
      region: 'au'
    };

    directionsService.route(request, (response, status) => {
        if (status == google.maps.DirectionsStatus.OK) {
          let leg = response.routes[0].legs[0];

          let distance = leg.distance.value / 1000; // 1km
          let duration = leg.duration.value / 60; // gives it in minutes

          let odometerStart = this.state.odometer;
          let odometerEnd = odometerStart + distance;

          let startTime = this.state.entryTime;
          let endTime = moment(this.state.entryTime).add(duration, 'minutes');


          let entry = {
            fromSub: this.state.fromSub,
            toSub: this.state.toSub,

            date: this.state.entryDate,
            
            distance,
            duration,
            odometerStart,
            odometerEnd,
            endTime,

            hours: duration / 60,
          }

          this._addResult(entry)

        } else {
            throw new Error("directionsService faaaailed: " + status);
        }
    });
  }

  advance2to5Days() {
    let x = moment(this.state.entryDate)
    x.add(getRandomInt(2, 5), 'days')
    this.setState({ entryDate: x })
  }

  advance7to20Days() {
    let x = moment(this.state.entryDate)
    x.add(getRandomInt(7, 20), 'days')
    this.setState({ entryDate: x })
  }

  returnJourney() {
    this.setState({
      fromSub: this.state.toSub,
      toSub: this.state.fromSub
    })
  }

  exportJson() {
    console.log(JSON.stringify(this.state.results))
  }

  render() {
    let totalHours = this.state.results.length > 1 ? this.state.results.reduce((total, res) => total + res.hours, this.state.results[0].hours) : 0;
    
    let entryDateFmttd = this.state.entryDate.format(DATEFORMAT);
    let entryTimeFmttd = this.state.entryTime.format(TIMEFORMAT)

    return (
      <div>
        <h3>Total hours: {totalHours}</h3>
        <button onClick={this.exportJson}>Export JSON</button>
          <input type="number" placeholder="Odometer start" value={this.state.odometer} onChange={(ev) => this.setState({ odometer: ev.target.value })}/>
          <p>Odometer: {this.state.odometer}</p>


        <div>
          <input type="text" placeholder="From suburb" value={this.state.fromSub} onChange={(ev) => this.setState({ fromSub: ev.target.value })} defaultValue={"Newtown"}/>
          <input type="text" value={this.state.toSub} placeholder="To suburb" onChange={(ev) => this.setState({ toSub: ev.target.value })} defaultValue={"Chippendale"}/>

          <input type="date" value={entryDateFmttd} onChange={(ev) => this.setState({ entryDate: moment(ev.target.value, DATEFORMAT) })}/>
          <input type="time" value={entryTimeFmttd} onChange={(ev) => this.setState({ entryTime: moment(ev.target.value, TIMEFORMAT) })}/>
          
          <input type="checkbox" checked={this.state.moveToNextDay} onChange={(val) => console.log(val)}/>

          <button onClick={this.addEntry}>Add</button>
          <button onClick={this.advance2to5Days}>Advance 2-5 days</button>
          <button onClick={this.advance7to20Days}>Advance 7-20 days</button>
          <button onClick={this.returnJourney}>Make return journey</button>

        </div>

        <h2>Results</h2>

        <table className="ui celled table">
          <thead>
            <tr>{LOGBOOK_HEADERS.map((header, i) => <th key={i}>{header}</th>)}
          </tr></thead>
          <tbody>
            {this.state.results.map((res, i) => <LogbookEntry key={i} {...res}/>)}
          </tbody>
        </table>
      </div>
    );
  }
}

class LogbookEntry extends Component {
  render() {
    let json = JSON.stringify(this.props, null, 1)

    return <tr>
      <td>{moment(this.props.date).format(DATEFORMAT)}</td>
      <td>{this.props.fromSub}</td>
      <td>{this.props.odometerStart}</td>
      <td>{this.props.toSub}</td>
      <td>{this.props.odometerEnd}</td>
      <td>{moment(this.props.startTime).format(TIMEFORMAT)}</td>
      <td>{moment(this.props.endTime).format(TIMEFORMAT)}</td>
      <td>{Math.round(this.props.duration, 1)}</td>
      <td>{Math.round(this.props.duration, 1)}</td>
      <td>{Math.round(this.props.duration, 1)}</td>
    </tr>
  }
}

export class App extends Component {
  render() {
    return (
      <div>
        <SwagDog/>
      </div>
    );
  }
}