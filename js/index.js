var searchHistoryEl = document.getElementById("search-history");
var searchButtonEl = document.getElementById("search-btn");
var searchFieldEl = document.getElementById("search-input");
var weatherInfoEl = document.getElementById("weather-info-container");

var historyList = [];
var OPENWEATHER_API_KEY = "";
// 6ff4f6cbe0c8a0dde6dff039c0ab5c6b

// init function
function init () {
    getLocalStorage()
    renderHistory()
}

// searched city event handler
function searchHandler (event) {
    event.preventDefault()

    // get the search input form the search field element
    var rawSearchInput = searchFieldEl.value;
    var capSearchInput = rawSearchInput.charAt(0).toUpperCase() + rawSearchInput.slice(1);
    var searchInput = capSearchInput.trim();

    checkIfCity(searchInput)
        .then(data => {
            if (data) {
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

            } else {
                alert("'" + searchInput + "' is not a valid city. Pleaee check your spelling and try again.")
            }
        })
        .catch(error => {
            console.error(error);
        });
}

// selected city from history event handler
function selectedFromHistoryHandler (event) {
    searchFieldEl.value = "";
    var selectedSearchFromHistoryEl = event.target
    var selectedCity = selectedSearchFromHistoryEl.innerText;

    clearHistoryHighlighting() // remove any special styles
    highlightHistoryOption(selectedSearchFromHistoryEl) // higlight newly selected from history

    checkIfCity(selectedCity)
        .then(data => {
            if (data) {
                clearWeatherInfo() // remove any current weather info rendered to te page
                getWeather(selectedCity) // now render te new weather info
            } else {
                alert("'" + searchInput + "' is not a valid city. Pleaee check your spelling and try again.")
            }
        });
}

// add an item to local storage
function addNewToLocalStorage (item) {
    var itemCleaned = item;
    var newIndex = localStorage.length;
    localStorage.setItem(newIndex, itemCleaned);
}

// get everything from local storage ans sort it
function getLocalStorage () {
    historyList = Object.values(localStorage).sort();
}

// render the weather info from the parsed city and its data
function renderWeatherInfo(city, data) {
    var todaysForecast = data.todaysForecast;
    var nextFiveDaysForecast = data.nextFiveDaysForecast;
    
    weatherInfoEl.innerHTML = "" //reset

    // loop over each forecast for the next 5 days and create elements for each
    var nextFiveDaysHTML = ""
    for (var day in nextFiveDaysForecast) {
        nextFiveDaysHTML = nextFiveDaysHTML + `
        <div class="col-2 future-forecast-card">
            <p class="mb-0 mt-2">`+ moment.unix(nextFiveDaysForecast[day].dt).format("dddd, Do")+`</p>
            <p class="m-0">`+ moment.unix(nextFiveDaysForecast[day].dt).format("MMMM")+`</p>
            <img class="img-fluid" src="http://openweathermap.org/img/wn/`+ nextFiveDaysForecast[day].weather[0].icon +`@2x.png">
            <p>Temp: `+ nextFiveDaysForecast[day].temp.day+` ºC</p>
            <p>Wind: `+ nextFiveDaysForecast[day].wind_speed+` MPH</p>
            <p class="mb-2">Humidity: `+ nextFiveDaysForecast[day].humidity+`%</p>
        </div>
        `
    }

    // create the main element for todays forecast
    var todaysWeatherEl = document.createElement("div")
    todaysWeatherEl.innerHTML = `
    <div class="container">
        <div class="row justify-content-between">
            <div class="col-6">
                <h3>`+ city +`</h3>
                <p>`+ moment.unix(todaysForecast.dt).format("dddd, Do MMMM") +`</p>  
            </div>
            <div class="col-6 row justify-content-end">
                <div class="col-3 d-flex align-items-center">
                    <img class="img-fluid" src="http://openweathermap.org/img/wn/`+ todaysForecast.weather[0].icon +`@2x.png">
                </div>
                <div class="col-4 d-flex align-items-center">
                    <h3 id="todays-temp">`+ Math.floor(todaysForecast.temp) +` ºC</h3> 
                </div>
            </div>
        </div>
        <div class="row" id="other-info">
            <p class="col-3 my-2 text-center">Wind: ` + todaysForecast.wind_speed + ` MPH</p>
            <p class="col-3 my-2 text-center">Humidity: ` + todaysForecast.humidity + `%</p>
            <p class="col-3 my-2 text-center">Condition: ` + todaysForecast.weather[0].description + `</p>
            <p class="col-3 my-2 text-center" id="uv-index" data-uv="`+ todaysForecast.uvi +`">UV Index: ` + todaysForecast.uvi + `</p>
        </div>
        <div class="row justify-content-between my-3" id="next-five-days-info">
        `+ nextFiveDaysHTML +`
        </div>
    </div>
    `

    weatherInfoEl.append(todaysWeatherEl) //append all the forecast elements
    styleUVIndex() // style uv index element
}

// rander all search history items to the page
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

// change background colour of uv index element, depending on the uv value of the element
function styleUVIndex () {
    var uvIndexEl = document.getElementById("uv-index");

    if (uvIndexEl.dataset["uv"] < 3) {
        uvIndexEl.style.backgroundColor = "green"
        
    } else if (uvIndexEl.dataset["uv"] < 6) {
        uvIndexEl.style.backgroundColor = "yellow"
        
    } else if (uvIndexEl.dataset["uv"] < 8) {
        uvIndexEl.style.backgroundColor = "orange"
        
    } else if (uvIndexEl.dataset["uv"] < 11) {
        uvIndexEl.style.backgroundColor = "red"
        
    } else {
        uvIndexEl.style.backgroundColor = "purple"
    }
    
}

// highlight the parsed button element
function highlightHistoryOption (historyOption) {
    historyOption.classList.remove("btn-secondary")
    historyOption.classList.add("btn-success")
}

// clear any styling of the history buttons
function clearHistoryHighlighting () {
    var renderedHistoryOptions = document.querySelectorAll(".history-btn")
    for (var i = 0; i < renderedHistoryOptions.length; i++) {
        renderedHistoryOptions[i].classList.remove("btn-success");  
        renderedHistoryOptions[i].classList.add("btn-secondary");  
    }
}

// clear any weathher info
function clearWeatherInfo () {
    weatherInfoEl.style.transition = "500ms";
    weatherInfoEl.style.opacity = "0";

    //wait for transition of opacity to finish
    setTimeout(() => {
        weatherInfoEl.innerHTML = "Loading...";
        weatherInfoEl.style.opacity = "1";
    }, 500)
    
}

// render the handler for the parsed button
function renderButtonEventListeners (newHistoryEl) {
    newHistoryEl.addEventListener("click", selectedFromHistoryHandler);
}

// check if te city parsed exists or not
function checkIfCity (city) {

    // regardless if city exists or not, this api will return something. If the city doesnt actually exist, then it will return an empty array, which can be used to check  
    return fetch("https://api.openweathermap.org/geo/1.0/direct?q=" + city + "&limit=5&appid=" + OPENWEATHER_API_KEY)
        .then(response => response.json())
        .then(data => {
            if (data.length !== 0) {
                return true
            } else {
                return false
            }
        })
}

// get weather from open weather API
function getWeather (city) {
    
    // once the long and let is returned, then get the actual weather info using that the long and lat
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

// get long and lat for parsed city
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

init() // begin initial function

// event listeners
searchButtonEl.addEventListener("click", searchHandler)