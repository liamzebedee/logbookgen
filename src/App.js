import React, { Component } from 'react';
import moment from 'moment';
function roundMinutes(momentObj) {
  var rounded = roundMinutesPure(momentObj.minute());
  let x = momentObj.minute(rounded).second(0)
  return x
}

function roundMinutesPure(mins) {
  // return mins;
  return Math.ceil(mins / 15) * 15;
}


function saveData(data) {
  localStorage.setItem("data", JSON.stringify(data))
}
function loadData() {
  return JSON.parse(localStorage.getItem("data") || "{}");
}




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
    this.advanceTomorrow = this.advanceTomorrow.bind(this)
    this.advance7to20Days = this.advance7to20Days.bind(this)
    this.returnJourney = this.returnJourney.bind(this)
    this.loadFromJson = this.loadFromJson.bind(this)
  }

  componentDidMount() {
    let data = loadData();
    if(data === {}) return;
    this.setState(Object.assign(data, {
      // Do a heap of moment unpacking etc.
      entryDate: moment(data.entryDate),
      entryTime: moment(data.entryTime),
      results: data.results.map(result => {
        result.startTime = moment(result.startTime);
        result.endTime = moment(result.endTime);
        return result;
      })

    }))
  }

  _addResult(res) {
    this.setState({ 
      results: this.state.results.concat([res]), 
      odometer: res.odometerEnd.toFixed(0), 
      entryTime: res.endTime,
    })
    saveData(this.state)
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
          let duration = roundMinutesPure(leg.duration.value / 60); // gives it in minutes

          let odometerStart = +this.state.odometer;
          let odometerEnd = odometerStart + distance;

          let startTime = roundMinutes(this.state.entryTime.clone());
          let endTime = roundMinutes(moment(this.state.entryTime).add(duration, 'minutes'));


          let entry = {
            fromSub: this.state.fromSub,
            toSub: this.state.toSub,

            date: this.state.entryDate,
            
            distance,
            duration,
            odometerStart,
            odometerEnd,
            startTime,
            endTime,

            hours: duration / 60,
          }

          this._addResult(entry)

        } else {
            throw new Error("directionsService faaaailed: " + status);
        }
    });
  }

  advanceTomorrow() {
    let x = moment(this.state.entryDate)
    x.add(1, 'days')
    this.setState({ entryDate: x })
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

  resetData() {
    saveData({})
    location.reload()
  }

  exportJson() {
    let str = JSON.stringify(this.state.results)
    prompt("Copy and paste your JSON string for more fun!", str);
  }

  loadFromJson(jsonString) {
    let jsonStr = prompt("Enter previous JSON");
    this.setState({ results: JSON.parse(jsonStr) });
  }

  render() {
    let totalHours = this.state.results.length > 1 ? this.state.results.reduce((total, res) => total + res.hours, this.state.results[0].hours) : 0;
    totalHours = totalHours.toFixed(2);
    
    let entryDateFmttd = this.state.entryDate.format(DATEFORMAT);
    let entryTimeFmttd = this.state.entryTime.format(TIMEFORMAT);

    return (
      <div>

        <div className  ="ui inverted fixed menu">
          <a className="active item">
            Logbook Faker
          </a>
          <a className="item">
            {totalHours}&nbsp;HRS
          </a>
          <div className='item'>
            <div className="ui inverted transparent icon input">
             <input style={{textAlign: 'right', width: 120}}  type="number" placeholder="Odometer start" value={this.state.odometer} onChange={(ev) => this.setState({ odometer: ev.target.value })}/>KM
              <i className="number icon"></i>
            </div>
          </div>


        </div>

        <div className='ui container' style={{ marginTop: '44px', padding: "1em 0em" }}>

            <div className="ui segment form">
              <h3 className='title'>Create new entry</h3>
              <div className='four fields'>
                <input type="text" placeholder="From suburb" value={this.state.fromSub} onChange={(ev) => this.setState({ fromSub: ev.target.value })} defaultValue={"Newtown"}/>
                <input type="text" value={this.state.toSub} placeholder="To suburb" onChange={(ev) => this.setState({ toSub: ev.target.value })} defaultValue={"Chippendale"}/>
                <input type="time" value={entryTimeFmttd} onChange={(ev) => this.setState({ entryTime: moment(ev.target.value, TIMEFORMAT) })}/>
                <input type="date" value={entryDateFmttd} onChange={(ev) => this.setState({ entryDate: moment(ev.target.value, DATEFORMAT) })}/>
              </div>
              <div className='ui basic buttons'>
              <button className='ui green basic button' onClick={this.addEntry}><i className='ui add icon'></i> Add</button>
              <button className='ui basic button' onClick={this.advanceTomorrow}>Advance to tomorrow</button>
              <button className='ui basic button' onClick={this.advance2to5Days}>Advance 2-5 days</button>
              <button className='ui basic button' onClick={this.advance7to20Days}>Advance 7-20 days</button>
              <button className='ui basic button' onClick={this.returnJourney}>Make return journey</button>
            </div>
            </div>



            

            

          <h2><i className='ui list icon'></i> Entries</h2>
          <table className="ui celled table">
            <thead>
              <tr>{LOGBOOK_HEADERS.map((header, i) => <th key={i}>{header}</th>)}
            </tr></thead>
            <tbody>
              {this.state.results.map((res, i) => <LogbookEntry key={i} {...res}/>)}
            </tbody>
          </table>

          <button className='ui assertive button' onClick={this.resetData}>Reset</button>
          <button className='ui item button' onClick={this.exportJson}>Export JSON</button>
          <button className='ui item button' onClick={this.loadFromJson}>Load from JSON</button>
        </div>


      </div>
    );
  }
}


// Returns fractional value of hours between two times
function getHoursBetween(startBoundary, endBoundary, startHour, endHour) {
  let maxStart = Math.max(startHour, startBoundary)
  let maxEnd = Math.min(endHour, endBoundary)
  return Math.max(maxEnd - maxStart, 0);
}

const getDayHours = (startHour, endHour) => getHoursBetween(6, 19, startHour, endHour)


class LogbookEntry extends Component {
  render() {
    let json = JSON.stringify(this.props, null, 1);

    let startHour = this.props.startTime.get('hour') + (this.props.startTime.get('minute') / 60);
    let endHour = this.props.endTime.get('hour') + (this.props.endTime.get('minute') / 60);
    
    let dayMins = Math.round(getDayHours(startHour, endHour) * 60)
    let nightMins = this.props.duration - dayMins;

    return <tr>
      <td>{moment(this.props.date).format(DATEFORMAT)}</td>
      <td>{this.props.fromSub}</td>
      <td>{this.props.odometerStart}</td>
      <td>{this.props.toSub}</td>
      <td>{this.props.odometerEnd}</td>
      <td>{moment(this.props.startTime).format(TIMEFORMAT)}</td>
      <td>{moment(this.props.endTime).format(TIMEFORMAT)}</td>
      <td>{Math.round(this.props.duration, 1)}</td>
      <td>{dayMins}</td>
      <td>{nightMins}</td>
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