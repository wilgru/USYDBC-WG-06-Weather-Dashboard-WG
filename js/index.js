var searchHistoryEl = document.getElementById("search-history");
var searchButtonEl = document.getElementById("search-btn");
var searchFieldEl = document.getElementById("search-input");
var weatherInfoEl = document.getElementById("weather-info-container");

var historyList = [];
var OPENWEATHER_API_KEY = ;

// 
function init () {
    getLocalStorage()
    renderHistory()
}

// 
function addNewToLocalStorage (item) {
    var itemCleaned = item;
    var newIndex = localStorage.length;
    localStorage.setItem(newIndex, itemCleaned);
}

// 
function getLocalStorage() {
    historyList = Object.values(localStorage).sort();
}

// 
function renderHistory () {
    searchHistoryEl.innerHTML = "";

    for (var i = 0; i < historyList.length; i++) {
        var newHistoryRowEl = document.createElement("div");
        var newHistoryEl = document.createElement("button");

        newHistoryRowEl.classList.add("row", "justify-content-center")
        newHistoryEl.innerText = historyList[i];
        newHistoryEl.classList.add("col-10", "btn", "history-btn", "btn-secondary", "m-1");
        newHistoryEl.dataset.city = historyList[i]

        newHistoryRowEl.appendChild(newHistoryEl);
        searchHistoryEl.appendChild(newHistoryRowEl);

        renderButtonEventListeners(newHistoryEl)
    }
}

// 
function searchHandler (event) {
    event.preventDefault()

    var searchInput = searchFieldEl.value;

    checkIfCity(searchInput)
        .then(data => {
            if (data !== []) {
                // if its new then add it to history
                if (!historyList.includes(searchInput)) {
                    addNewToLocalStorage(searchInput);
                    getLocalStorage();
                    renderHistory();
                }

                searchFieldEl.value = ""; // clear the value in the search field
                highlightHistoryOption(document.querySelector("[data-city='"+ searchInput +"']")) // highlight newly searched item
                clearWeatherInfo() // clear anny current weather info
                getWeather(searchInput) // get new weather info
            }
        })
        .catch(error => {
            console.error(error);
        });
}

// 
function selectedFromHistoryHandler (event) {
    searchFieldEl.value = "";
    var selectedSearchFromHistoryEl = event.target
    var selectedCity = selectedSearchFromHistoryEl.innerText;

    clearHistoryHighlighting() // remove any special styles
    highlightHistoryOption(selectedSearchFromHistoryEl) // higlight newly selected from history

    checkIfCity(selectedCity)
        .then(data => {
            if (data !== []) {
                clearWeatherInfo() // remove any currwnt weather info rendered to te page
                getWeather(selectedCity) // now render te new weather info
            }
        });
}

// 
function checkIfCity(city) {
    return fetch("https://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=5&appid=" + OPENWEATHER_API_KEY)
        .then(response => response.json())
        .then(data => {
            return data
        })
}

// 
function renderWeatherInfo(city, data) {
    var todaysForecast = data.todaysForecast;
    var nextFiveDaysForecast = data.nextFiveDaysForecast;
    console.log(nextFiveDaysForecast)

    var nextFiveDaysHTML = ""
    for (var day in nextFiveDaysForecast) {
        console.log(nextFiveDaysForecast[day])
        nextFiveDaysHTML = nextFiveDaysHTML + `
        <div class="col-2">
            <p>`+ moment.unix(nextFiveDaysForecast[day].dt).format("dddd, Do MMMM")+`</p>
            <img class="img-fluid" src="http://openweathermap.org/img/wn/`+ nextFiveDaysForecast[day].weather[0].icon +`@2x.png">
            <p>Temp: `+ nextFiveDaysForecast[day].temp.day+`</p>
            <p>Wind: `+ nextFiveDaysForecast[day].wind_speed+`</p>
            <p>Humidity: `+ nextFiveDaysForecast[day].humidity+`</p>
        </div>
        `
    }

    // 
    var todaysWeatherEl = document.createElement("div")
    todaysWeatherEl.innerHTML = `
    <div class="container">
        <div class="row">
            <div class="col-6">
                <h3>`+ city +`</h3>
                <p>`+ moment.unix(todaysForecast.dt).format("dddd, Do MMMM") +`</p>  
            </div>
            <div class="col-6 row justify-content-end">
                <div class="col-3 d-flex align-items-center">
                    <img class="img-fluid" src="http://openweathermap.org/img/wn/`+ todaysForecast.weather[0].icon +`@2x.png">
                </div>
                <div class="col-6 d-flex align-items-center">
                    <h3 id="todays-temp">`+ todaysForecast.temp +` C</h3> 
                </div>
            </div>
        </div>
        <div class="row" id="other-info">
            <p class="col-3 my-2 text-center">Wind: ` + todaysForecast.wind_speed + ` MPH</p>
            <p class="col-3 my-2 text-center">Humidity: ` + todaysForecast.humidity + `</p>
            <p class="col-3 my-2 text-center">Condition: ` + todaysForecast.weather[0].description + `</p>
            <p class="col-3 my-2 text-center">UV Index: ` + todaysForecast.uvi + `</p>
        </div>
        <div class="row justify-content-between my-3" id="next-five-days-info">
        `+ nextFiveDaysHTML +`
        </div>
    </div>
    `

    weatherInfoEl.append(todaysWeatherEl)
}

// 
function clearWeatherInfo() {
    weatherInfoEl.innerHTML = "";
}

// 
function highlightHistoryOption (historyOption) {
    historyOption.classList.remove("btn-secondary")
    historyOption.classList.add("btn-success")
}

// 
function clearHistoryHighlighting () {
    var renderedHistoryOptions = document.querySelectorAll(".history-btn")
    for (var i = 0; i < renderedHistoryOptions.length; i++) {
        renderedHistoryOptions[i].classList.remove("btn-success");  
        renderedHistoryOptions[i].classList.add("btn-secondary");  
    }
}

// 
function renderButtonEventListeners(newHistoryEl) {
    newHistoryEl.addEventListener("click", selectedFromHistoryHandler);
}

// 
function getWeather (city) {
    getLongLat(city)
        .then(data => {
            fetch("https://api.openweathermap.org/data/2.5/onecall?lat="+data[0]+"&lon="+data[1]+"&units=metric&appid=" + OPENWEATHER_API_KEY)
                .then(response => response.json())
                .then(data => {
                    var forecasts = {
                        todaysForecast: data.current,
                        nextFiveDaysForecast: data.daily.slice(0, 5)
                    }
                    renderWeatherInfo(city, forecasts)
                })
                .catch(error => {
                    console.error(error);
                });
        })
}

// 
function getLongLat (city) {
    return fetch("https://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=5&appid=" + OPENWEATHER_API_KEY)
        .then(response => response.json())
        .then(data => {
            return [data[0].lat, data[0].lon];
        })
        .catch(error => {
            console.error(error);
        });
}

init()

searchButtonEl.addEventListener("click", searchHandler)
