const cityInput = document.querySelector('.city-input')
const searchBtn = document.querySelector('.search-btn')
const homeBtn = document.querySelector('.home-btn')
const backBtn = document.querySelector('.back-btn')
const forwardBtn = document.querySelector('.forward-btn')
const locationBtn = document.querySelector('.location-btn')
const unitToggle = document.querySelector('.unit-toggle')
const themeToggle = document.querySelector('.theme-toggle')
const favoriteBtn = document.querySelector('.favorite-btn')
const retryBtn = document.querySelector('.retry-btn')

const notFoundSection = document.querySelector('.not-found')
const searchCitySection = document.querySelector('.search-city')
const weatherInfoSection = document.querySelector('.weather-info')
const errorTitle = document.querySelector('.error-title')
const errorMessage = document.querySelector('.error-message')

const countryTxt = document.querySelector('.country-txt')
const tempTxt = document.querySelector('.temp-txt')
const conditionTxt = document.querySelector('.condition-txt')
const feelsLikeTxt = document.querySelector('.feels-like-txt')
const humidityValueTxt = document.querySelector('.humidity-value-txt')
const windValueTxt = document.querySelector('.wind-value-txt')
const pressureValueTxt = document.querySelector('.pressure-value-txt')
const visibilityValueTxt = document.querySelector('.visibility-value-txt')
const weatherInsight = document.querySelector('.weather-insight')
const weatherSummaryImg = document.querySelector('.weather-summary-img')
const currentDateTxt = document.querySelector('.current-date-txt')

const forecastItemsContainer = document.querySelector('.forecast-items-container')
const historyList = document.querySelector('.history-list')
const favoritesList = document.querySelector('.favorites-list')
const clearHistoryBtn = document.querySelector('.clear-history-btn')
const clearFavoritesBtn = document.querySelector('.clear-favorites-btn')
const suggestionsList = document.querySelector('#search-suggestions')
const dashboardGrid = document.querySelector('.dashboard-grid')
const dashboardStatus = document.querySelector('.dashboard-status')
const viewCountriesBtn = document.querySelector('.view-countries-btn')
const sideCityTxt = document.querySelector('.side-city-txt')
const sunriseTxt = document.querySelector('.sunrise-txt')
const sunsetTxt = document.querySelector('.sunset-txt')
const cloudCoverTxt = document.querySelector('.cloud-cover-txt')
const windDirectionTxt = document.querySelector('.wind-direction-txt')
const comfortLabelTxt = document.querySelector('.comfort-label-txt')
const comfortFill = document.querySelector('.comfort-fill')
const comfortNote = document.querySelector('.comfort-note')
const quickCityGrid = document.querySelector('.quick-city-grid')

const welcomeScreen = document.querySelector('.welcome-screen')
const startBtn = document.querySelector('.start-btn')
const defaultSearchPlaceholder = cityInput.placeholder

const weatherApiEndpoint = '/.netlify/functions/weather'
const historyKey = 'weather-check-history'
const favoritesKey = 'weather-check-favorites'
const unitKey = 'weather-check-unit'
const themeKey = 'weather-check-theme'
const weatherSnapshotsKey = 'weather-check-recent-weather'
const themes = ['auto', 'dark', 'light', 'glass']
const dashboardCities = [
    { city: 'Manila', country: 'Philippines' },
    { city: 'Tokyo', country: 'Japan' },
    { city: 'Seoul', country: 'South Korea' },
    { city: 'Singapore', country: 'Singapore' },
    { city: 'London', country: 'United Kingdom' },
    { city: 'Paris', country: 'France' },
    { city: 'New York', country: 'United States' },
    { city: 'Sydney', country: 'Australia' }
]

let searchStack = []
let historyIndex = -1
let recentSearches = loadList(historyKey)
let recentWeatherSnapshots = loadObject(weatherSnapshotsKey)
let favorites = loadList(favoritesKey)
let unit = localStorage.getItem(unitKey) || 'metric'
let themeMode = localStorage.getItem(themeKey) || 'auto'
let lastSearch = null
let currentCity = ''
let activeRequestId = 0

startBtn.addEventListener('click', () => {
    welcomeScreen.classList.add('hide-welcome')
    setTimeout(() => {
        welcomeScreen.style.display = 'none'
    }, 600)
})

searchBtn.addEventListener('click', () => handleSearch())
homeBtn.addEventListener('click', showHomeScreen)
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') handleSearch()
})

backBtn.addEventListener('click', () => moveHistory(-1))
forwardBtn.addEventListener('click', () => moveHistory(1))
locationBtn.addEventListener('click', useCurrentLocation)
unitToggle.addEventListener('click', switchUnit)
themeToggle.addEventListener('click', switchThemeMode)
favoriteBtn.addEventListener('click', toggleCurrentFavorite)
retryBtn.addEventListener('click', () => {
    if (!lastSearch) return
    if (lastSearch.type === 'coords') {
        updateWeatherByCoords(lastSearch.lat, lastSearch.lon, { addToStack: false })
    } else {
        updateWeatherInfo(lastSearch.city, { addToStack: false })
    }
})
clearHistoryBtn.addEventListener('click', () => {
    recentSearches = []
    saveList(historyKey, recentSearches)
    renderSavedLists()
})
viewCountriesBtn.addEventListener('click', toggleCountriesView)
quickCityGrid?.addEventListener('click', handleQuickCityClick)
clearFavoritesBtn.addEventListener('click', () => {
    favorites = []
    saveList(favoritesKey, favorites)
    renderSavedLists()
    updateFavoriteButton()
})

function showHomeScreen() {
    showDisplaySection(searchCitySection)
    currentCity = ''
    updateFavoriteButton()
}

function toggleCountriesView() {
    const isHidden = dashboardGrid.classList.toggle('is-hidden')
    viewCountriesBtn.textContent = isHidden ? 'View Countries' : 'Hide Countries'
    dashboardStatus.textContent = isHidden
        ? 'Choose a country card to view its forecast.'
        : 'Tap any country card to open its forecast.'

    if (!isHidden && dashboardGrid.children.length === 0) {
        loadDashboardWeather()
    }
}
async function loadDashboardWeather() {
    renderDashboardPlaceholders()
    dashboardStatus.textContent = 'Choose a country card to view its forecast.'

    const results = await Promise.allSettled(
        dashboardCities.map(item => getFetchData('weather', { q: item.city }))
    )

    dashboardGrid.innerHTML = ''
    results.forEach((result, index) => {
        const cityInfo = dashboardCities[index]
        if (result.status === 'fulfilled') {
            dashboardGrid.appendChild(createDashboardCard(cityInfo, result.value))
        } else {
            dashboardGrid.appendChild(createDashboardPlaceholderCard(cityInfo, true))
        }
    })

    dashboardStatus.textContent = 'Tap any card to open the full forecast.'
    setupHeaderInfoTooltips()
}

function renderDashboardPlaceholders() {
    dashboardGrid.innerHTML = ''
    dashboardCities.forEach(item => {
        dashboardGrid.appendChild(createDashboardPlaceholderCard(item, false))
    })
}

function createDashboardCard(cityInfo, weatherData) {
    const {
        name,
        main: { temp, humidity },
        weather: [{ id, main }]
    } = weatherData

    const card = document.createElement('button')
    card.className = 'dashboard-card'
    card.type = 'button'
    card.setAttribute('aria-label', `Open weather for ${name}`)
    card.innerHTML = `
        <div class="dashboard-card-top">
            <div>
                <h5 class="dashboard-city">${cityInfo.country}</h5>
                <p class="dashboard-country">${name}</p>
            </div>
            <span class="dashboard-temp">${formatTemp(temp)}</span>
        </div>
        <div class="dashboard-card-bottom">
            <img src="assets/weather/${getWeatherIcon(id, main)}" class="dashboard-icon" alt="${main}" />
            <div>
                <p class="dashboard-condition">${main}</p>
                <p class="dashboard-meta">Humidity ${humidity}%</p>
            </div>
        </div>
    `
    card.addEventListener('click', () => handleSearch(name))
    return card
}

function createDashboardPlaceholderCard(cityInfo, isOffline) {
    const card = document.createElement('button')
    card.className = `dashboard-card ${isOffline ? 'is-error' : 'is-preview'}`
    card.type = 'button'
    card.setAttribute('aria-label', `View forecast for ${cityInfo.city}, ${cityInfo.country}`)
    card.innerHTML = `
        <div class="dashboard-card-top">
            <div>
                <h5 class="dashboard-city">${cityInfo.country}</h5>
                <p class="dashboard-country">${cityInfo.city}</p>
            </div>
            <span class="dashboard-temp">${isOffline ? '--' : 'View'}</span>
        </div>
        <div class="dashboard-card-bottom">
            <span class="material-symbols-outlined dashboard-symbol">${isOffline ? 'cloud_off' : 'travel_explore'}</span>
            <div>
                <p class="dashboard-condition">${isOffline ? 'Live preview unavailable' : 'Open forecast'}</p>
                <p class="dashboard-meta">Tap to search ${cityInfo.city}</p>
            </div>
        </div>
    `
    card.addEventListener('click', () => handleSearch(cityInfo.city))
    return card
}
function handleSearch(cityFromButton) {
    const city = (cityFromButton || cityInput.value).trim()
    if (city === '') return
    applyRecentMood(city)
    updateWeatherInfo(city)
    cityInput.value = ''
    cityInput.blur()
}

async function getFetchData(endPoint, params) {
    const searchParams = new URLSearchParams({
        endpoint: endPoint,
        units: unit,
        ...params
    })
    const response = await fetch(`${weatherApiEndpoint}?${searchParams.toString()}`, { cache: 'no-store' })

    if (!response.ok) {
        const details = await response.json().catch(() => ({}))
        const message = details.message || `Weather request failed: ${response.status}`
        throw new Error(message)
    }

    return response.json()
}

function getWeatherIcon(id, condition = '') {
    const weatherId = Number(id)
    const label = String(condition || '').toLowerCase()

    if ((weatherId >= 200 && weatherId <= 232) || label.includes('thunder')) return 'thunderstorm.svg'
    if ((weatherId >= 300 && weatherId <= 321) || label.includes('drizzle')) return 'drizzle.svg'
    if ((weatherId >= 500 && weatherId <= 531) || label.includes('rain')) return 'rain.svg'
    if ((weatherId >= 600 && weatherId <= 622) || label.includes('snow')) return 'snow.svg'
    if ((weatherId >= 701 && weatherId <= 781) || label.includes('mist') || label.includes('smoke') || label.includes('haze') || label.includes('dust') || label.includes('fog') || label.includes('sand') || label.includes('ash') || label.includes('squall') || label.includes('tornado')) return 'atmosphere.svg'
    if (weatherId === 800 || label.includes('clear')) return 'clear.svg'
    if ((weatherId >= 801 && weatherId <= 804) || label.includes('cloud')) return 'clouds.svg'

    return 'clouds.svg'
}

function getWeatherMoodClass(id, condition = '') {
    const weatherId = Number(id)
    const label = String(condition || '').toLowerCase()

    if ((weatherId >= 200 && weatherId <= 232) || label.includes('thunder')) return 'weather-thunderstorm'
    if ((weatherId >= 300 && weatherId <= 321) || (weatherId >= 500 && weatherId <= 531) || label.includes('drizzle') || label.includes('rain')) return 'weather-rain'
    if ((weatherId >= 600 && weatherId <= 622) || label.includes('snow')) return 'weather-snow'
    if ((weatherId >= 701 && weatherId <= 781) || label.includes('mist') || label.includes('smoke') || label.includes('haze') || label.includes('dust') || label.includes('fog') || label.includes('sand') || label.includes('ash') || label.includes('squall') || label.includes('tornado')) return 'weather-atmosphere'
    if (weatherId === 800 || label.includes('clear')) return 'weather-clear'
    if ((weatherId >= 801 && weatherId <= 804) || label.includes('cloud')) return 'weather-clouds'

    return 'weather-clouds'
}

function getCurrentDate() {
    const currentDate = new Date()
    const options = {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
    }
    return currentDate.toLocaleDateString('en-GB', options)
}

async function updateWeatherInfo(city, options = {}) {
    const normalizedCity = titleCase(city)
    const requestId = ++activeRequestId
    setLoadingState(true)
    lastSearch = { type: 'city', city: normalizedCity }

    try {
        const weatherData = await getFetchData('weather', { q: city })
        const forecastsData = await getFetchData('forecast', { q: city }).catch(error => {
            console.warn('Forecast unavailable:', error)
            return { list: [] }
        })
        if (requestId !== activeRequestId) return
        renderWeather(weatherData, forecastsData)
        rememberCity(weatherData.name || normalizedCity, options)
    } catch (error) {
        if (requestId !== activeRequestId) return
        showError(error)
    } finally {
        if (requestId === activeRequestId) {
            setLoadingState(false)
            restoreScroll(options.keepScroll)
        }
    }
}

async function updateWeatherByCoords(lat, lon, options = {}) {
    const requestId = ++activeRequestId
    setLoadingState(true)
    lastSearch = { type: 'coords', lat, lon }

    try {
        const weatherData = await getFetchData('weather', { lat, lon })
        const forecastsData = await getFetchData('forecast', { lat, lon }).catch(error => {
            console.warn('Forecast unavailable:', error)
            return { list: [] }
        })
        if (requestId !== activeRequestId) return
        renderWeather(weatherData, forecastsData)
        rememberCity(weatherData.name || 'Current Location', options)
    } catch (error) {
        if (requestId !== activeRequestId) return
        showError(error)
    } finally {
        if (requestId === activeRequestId) {
            setLoadingState(false)
            restoreScroll(options.keepScroll)
        }
    }
}

function renderWeather(weatherData, forecastsData) {
    const {
        name,
        main: { temp, feels_like, humidity, pressure },
        weather: [{ id, main }],
        wind: { speed },
        visibility
    } = weatherData

    currentCity = name
    countryTxt.textContent = name
    tempTxt.textContent = formatTemp(temp)
    conditionTxt.textContent = main
    feelsLikeTxt.textContent = `Feels like ${formatTemp(feels_like)}`
    humidityValueTxt.textContent = `${humidity}%`
    windValueTxt.textContent = `${Number(speed).toFixed(1)} ${unit === 'metric' ? 'm/s' : 'mph'}`
    pressureValueTxt.textContent = `${pressure} hPa`
    visibilityValueTxt.textContent = `${((visibility || 0) / 1000).toFixed(1)} km`
    currentDateTxt.textContent = getCurrentDate()
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id, main)}`
    weatherSummaryImg.alt = main
    weatherInsight.textContent = getWeatherInsight(id, temp, speed)

    try {
        saveRecentWeatherSnapshot(weatherData)
        updateWeatherTheme(weatherData)
        updateSidePanel(weatherData)
    } catch (error) {
        console.warn('Extra weather features skipped:', error)
    }

    updateForecastsInfo(forecastsData)
    setupHeaderInfoTooltips()
    updateFavoriteButton()
    showDisplaySection(weatherInfoSection)
}


function handleQuickCityClick(event) {
    const button = event.target.closest('button[data-city]')
    if (!button) return
    handleSearch(button.dataset.city)
}

function updateSidePanel(weatherData) {
    const {
        name,
        main: { temp, humidity },
        wind: { speed, deg },
        clouds,
        sys,
        timezone
    } = weatherData

    if (!sideCityTxt) return
    sideCityTxt.textContent = name + ' extra weather details'
    sunriseTxt.textContent = formatCityTime(sys?.sunrise, timezone)
    sunsetTxt.textContent = formatCityTime(sys?.sunset, timezone)
    cloudCoverTxt.textContent = `${clouds?.all ?? 0}%`
    windDirectionTxt.textContent = `${getWindDirection(deg)}${typeof deg === 'number' ? ` ${Math.round(deg)}°` : ''}`

    const comfort = getComfortScore(temp, humidity, speed)
    comfortLabelTxt.textContent = comfort.label
    comfortFill.style.width = `${comfort.score}%`
    comfortFill.style.background = comfort.color
    comfortNote.textContent = comfort.note
}

function formatCityTime(timestamp, timezoneOffset = 0) {
    if (!timestamp) return '--'
    const utcMs = timestamp * 1000
    const localMs = utcMs + (timezoneOffset * 1000) + (new Date().getTimezoneOffset() * 60000)
    return new Date(localMs).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    })
}

function getWindDirection(degrees) {
    if (typeof degrees !== 'number') return '--'
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return directions[Math.round(degrees / 45) % 8]
}

function getComfortScore(temp, humidity, speed) {
    const metricTemp = unit === 'metric' ? temp : (temp - 32) * 5 / 9
    let score = 88
    if (metricTemp >= 32) score -= (metricTemp - 31) * 8
    if (metricTemp <= 16) score -= (17 - metricTemp) * 6
    if (humidity >= 75) score -= (humidity - 74) * 0.5
    if (speed >= 8) score -= Math.min(18, (speed - 7) * 2)
    score = Math.max(14, Math.min(100, Math.round(score)))

    if (score >= 78) {
        return { score, label: 'Great', color: '#8be7c4', note: 'Comfortable weather for errands or outdoor plans.' }
    }
    if (score >= 55) {
        return { score, label: 'Okay', color: '#ffd76a', note: 'Pretty manageable. Check humidity and wind before heading out.' }
    }
    return { score, label: 'Careful', color: '#ff9a8a', note: 'Plan lighter activity, bring water, or stay shaded when possible.' }
}
function updateForecastsInfo(forecastsData) {
    forecastItemsContainer.innerHTML = ''
    if (!Array.isArray(forecastsData.list) || forecastsData.list.length === 0) {
        forecastItemsContainer.innerHTML = '<div class="forecast-note regular-txt">Forecast unavailable right now.</div>'
        return
    }

    const timeTaken = '12:00:00'
    const todayDate = new Date().toISOString().split('T')[0]

    forecastsData.list
        .filter(item => item.dt_txt.includes(timeTaken) && !item.dt_txt.includes(todayDate))
        .slice(0, 5)
        .forEach(updateForecastsItems)
}

function updateForecastsItems(weatherData) {
    const {
        dt_txt: date,
        weather: [{ id, main }],
        main: { temp }
    } = weatherData

    const dateTaken = new Date(date)
    const dateResult = dateTaken.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short'
    })

    const forecastItem = `
      <div class="forecast-item" title="${main}">
        <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
        <img src="assets/weather/${getWeatherIcon(id, main)}" class="forecast-item-img" alt="${main}" />
        <h5 class="forecast-item-temp">${formatTemp(temp)}</h5>
      </div>
    `
    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem)
}


function saveRecentWeatherSnapshot(weatherData) {
    const city = titleCase(weatherData.name || '')
    if (!city) return

    const weather = weatherData.weather?.[0] || {}
    recentWeatherSnapshots[city.toLowerCase()] = {
        city,
        temp: Number(weatherData.main?.temp),
        unit,
        condition: weather.main || 'Weather',
        icon: getWeatherIcon(weather.id, weather.main),
        weatherId: weather.id || 0,
        moodClass: getWeatherMoodClass(weather.id, weather.main),
        isDay: isWeatherDaytime(weatherData),
        savedAt: Date.now()
    }

    const allowed = new Set(recentSearches.map(item => String(item).toLowerCase()))
    allowed.add(city.toLowerCase())
    Object.keys(recentWeatherSnapshots).forEach(key => {
        if (!allowed.has(key)) delete recentWeatherSnapshots[key]
    })
    saveObject(weatherSnapshotsKey, recentWeatherSnapshots)
}

function getRecentWeatherSnapshot(city) {
    return recentWeatherSnapshots[String(city).toLowerCase()]
}

function getWeatherClassFromIcon(iconName) {
    const icon = String(iconName || '').toLowerCase()
    if (icon.includes('thunder')) return 'weather-thunderstorm'
    if (icon.includes('rain') || icon.includes('drizzle')) return 'weather-rain'
    if (icon.includes('snow')) return 'weather-snow'
    if (icon.includes('atmosphere') || icon.includes('mist') || icon.includes('fog') || icon.includes('haze')) return 'weather-atmosphere'
    if (icon.includes('clear')) return 'weather-clear'
    return 'weather-clouds'
}

function applyRecentMood(city) {
    const snapshot = getRecentWeatherSnapshot(city)
    if (!snapshot) return
    setSmoothWeatherBackground(snapshot.moodClass || getWeatherClassFromIcon(snapshot.icon), snapshot.isDay !== false)
}

function isWeatherDaytime(weatherDataOrCondition) {
    if (!weatherDataOrCondition || typeof weatherDataOrCondition === 'string') return true
    const now = weatherDataOrCondition.dt || Math.floor(Date.now() / 1000)
    const sunrise = weatherDataOrCondition.sys?.sunrise
    const sunset = weatherDataOrCondition.sys?.sunset
    if (!sunrise || !sunset) return true
    return now >= sunrise && now < sunset
}

function renderChipWeather(city, isFavoriteList) {
    if (isFavoriteList) return ''
    const snapshot = getRecentWeatherSnapshot(city)
    if (!snapshot) return ''
    return `
        <span class="chip-weather ${snapshot.isDay ? 'is-day' : 'is-night'}" title="${snapshot.condition}">
            <img src="assets/weather/${snapshot.icon}" alt="${snapshot.condition}" />
            <span>${formatTempForUnit(snapshot.temp, snapshot.unit)}</span>
        </span>
    `
}
function rememberCity(city, options = {}) {
    const normalizedCity = titleCase(city)
    recentSearches = [normalizedCity, ...recentSearches.filter(item => item.toLowerCase() !== normalizedCity.toLowerCase())].slice(0, 8)
    saveList(historyKey, recentSearches)

    if (options.addToStack !== false) {
        searchStack = searchStack.slice(0, historyIndex + 1)
        searchStack.push(normalizedCity)
        historyIndex = searchStack.length - 1
    }

    renderSavedLists()
    updateNavButtons()
}

function moveHistory(direction) {
    const nextIndex = historyIndex + direction
    if (nextIndex < 0 || nextIndex >= searchStack.length) return
    historyIndex = nextIndex
    updateNavButtons()
    updateWeatherInfo(searchStack[historyIndex], { addToStack: false })
}

function updateNavButtons() {
    backBtn.disabled = historyIndex <= 0
    forwardBtn.disabled = historyIndex < 0 || historyIndex >= searchStack.length - 1
}

function toggleCurrentFavorite() {
    if (!currentCity) return
    toggleFavorite(currentCity)
}

function toggleFavorite(city) {
    const normalizedCity = titleCase(city)
    const exists = favorites.some(item => item.toLowerCase() === normalizedCity.toLowerCase())
    favorites = exists
        ? favorites.filter(item => item.toLowerCase() !== normalizedCity.toLowerCase())
        : [normalizedCity, ...favorites].slice(0, 8)
    saveList(favoritesKey, favorites)
    renderSavedLists()
    updateFavoriteButton()
}

function updateFavoriteButton() {
    const isFavorite = currentCity && favorites.some(item => item.toLowerCase() === currentCity.toLowerCase())
    favoriteBtn.classList.toggle('is-favorite', Boolean(isFavorite))
    favoriteBtn.setAttribute('aria-label', isFavorite ? 'Remove city from favorites' : 'Save city as favorite')
    favoriteBtn.dataset.tooltip = isFavorite ? 'Saved Favorite' : 'Favorite'
    favoriteBtn.dataset.tooltipDetail = isFavorite ? 'Remove this city from your favorites.' : 'Save this city for quick access.'
}

function renderSavedLists() {
    renderChipList(favoritesList, favorites, 'No favorites yet', true)
    renderChipList(historyList, recentSearches, 'No recent searches yet', false)
    renderSuggestions()
    setupHeaderInfoTooltips()
}

function renderChipList(container, list, emptyText, isFavoriteList) {
    container.innerHTML = ''
    if (list.length === 0) {
        container.innerHTML = `<span class="empty-chip">${emptyText}</span>`
        return
    }

    list.forEach(city => {
        const chip = document.createElement('div')
        chip.className = 'chip'
        chip.innerHTML = `
            <button class="chip-search" type="button">${city}</button>
            ${renderChipWeather(city, isFavoriteList)}
            ${isFavoriteList ? '' : `<button class="chip-pin" type="button" aria-label="Pin ${city}"><span class="material-symbols-outlined">star</span></button>`}
            <button class="chip-remove" type="button" aria-label="Remove ${city}"><span class="material-symbols-outlined">close</span></button>
        `

        chip.querySelector('.chip-search').addEventListener('click', () => handleSearch(city))
        chip.querySelector('.chip-remove').addEventListener('click', () => {
            if (isFavoriteList) {
                favorites = favorites.filter(item => item !== city)
                saveList(favoritesKey, favorites)
            } else {
                recentSearches = recentSearches.filter(item => item !== city)
                delete recentWeatherSnapshots[String(city).toLowerCase()]
                saveList(historyKey, recentSearches)
                saveObject(weatherSnapshotsKey, recentWeatherSnapshots)
            }
            renderSavedLists()
            updateFavoriteButton()
        })

        const pinBtn = chip.querySelector('.chip-pin')
        if (pinBtn) {
            const isPinned = favorites.some(item => item.toLowerCase() === city.toLowerCase())
            pinBtn.classList.toggle('is-pinned', isPinned)
            pinBtn.addEventListener('click', () => toggleFavorite(city))
        }

        container.appendChild(chip)
    })
}

function renderSuggestions() {
    const suggestions = [...new Set([...favorites, ...recentSearches])]
    suggestionsList.innerHTML = suggestions.map(city => `<option value="${city}"></option>`).join('')
}

function switchThemeMode() {
    const currentIndex = themes.indexOf(themeMode)
    themeMode = themes[(currentIndex + 1) % themes.length]
    localStorage.setItem(themeKey, themeMode)
    applyThemeMode()
}

function applyThemeMode() {
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-glass')
    themeToggle.dataset.mode = themeMode

    if (themeMode !== 'auto') {
        document.body.classList.add(`theme-${themeMode}`)
    }

    const labels = {
        auto: 'Auto weather colors',
        dark: 'Dark mode',
        light: 'Light mode',
        glass: 'Glass mode'
    }
    const icons = {
        auto: 'palette',
        dark: 'dark_mode',
        light: 'light_mode',
        glass: 'blur_on'
    }
    themeToggle.title = `Mode: ${labels[themeMode]}`
    themeToggle.dataset.tooltip = labels[themeMode]
    themeToggle.dataset.tooltipDetail = 'Click to change the app color mode.'
    themeToggle.setAttribute('aria-label', `Current mode: ${labels[themeMode]}. Click to change mode.`)
    themeToggle.querySelector('span').textContent = icons[themeMode]
}
function switchUnit() {
    const mainContainer = document.querySelector('.main-container')
    const previousScroll = mainContainer.scrollTop
    const isHomeOpen = searchCitySection.style.display !== 'none'

    unit = unit === 'metric' ? 'imperial' : 'metric'
    localStorage.setItem(unitKey, unit)
    updateUnitToggleLabel()
    loadDashboardWeather()

    if (isHomeOpen || !lastSearch) {
        restoreScroll(previousScroll)
        return
    }

    if (lastSearch.type === 'coords') {
        updateWeatherByCoords(lastSearch.lat, lastSearch.lon, { addToStack: false, keepScroll: previousScroll })
    } else {
        updateWeatherInfo(lastSearch.city, { addToStack: false, keepScroll: previousScroll })
    }
}

function useCurrentLocation() {
    if (!navigator.geolocation) {
        showFriendlyError('Location unavailable', 'Your browser does not support current location search.')
        return
    }

    setLoadingState(true)
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords
            updateWeatherByCoords(latitude, longitude)
        },
        () => {
            setLoadingState(false)
            showFriendlyError('Location blocked', 'Allow location access or search for your city manually.')
        },
        { enableHighAccuracy: true, timeout: 10000 }
    )
}

function getWeatherInsight(id, temp, speed) {
    const hotThreshold = unit === 'metric' ? 32 : 90
    const coldThreshold = unit === 'metric' ? 12 : 54

    if (id >= 200 && id <= 232) return 'Thunderstorms are possible. Stay indoors if the weather turns rough.'
    if (id >= 300 && id <= 531) return 'Bring an umbrella today. Rain is likely around this area.'
    if (id >= 600 && id <= 622) return 'Snowy conditions today. Dress warmly and watch your step.'
    if (temp >= hotThreshold) return 'It is warm today. Drink water and avoid too much direct sun.'
    if (temp <= coldThreshold) return 'It is cool today. A jacket would be a good idea.'
    if (speed >= 10) return 'Expect stronger winds. Secure light outdoor items.'
    if (id === 800) return 'Clear skies. Great weather for outdoor plans.'
    return 'Conditions look manageable. Check the forecast before heading out.'
}


function setSmoothWeatherBackground(weatherClass, isDay) {
    const gradients = {
        'weather-clear-day': 'linear-gradient(135deg, rgba(56, 166, 219, 0.28), rgba(255, 212, 102, 0.3), rgba(246, 253, 255, 0.22))',
        'weather-clear-night': 'linear-gradient(135deg, rgba(7, 22, 43, 0.58), rgba(31, 50, 94, 0.48), rgba(255, 226, 138, 0.12))',
        'weather-clouds-day': 'linear-gradient(135deg, rgba(81, 155, 188, 0.35), rgba(190, 210, 218, 0.36), rgba(255,255,255,0.12))',
        'weather-clouds-night': 'linear-gradient(135deg, rgba(9, 30, 45, 0.58), rgba(50, 74, 88, 0.46), rgba(145, 171, 184, 0.14))',
        'weather-rain-day': 'linear-gradient(135deg, rgba(12, 42, 64, 0.58), rgba(42, 91, 113, 0.45), rgba(178, 209, 219, 0.16))',
        'weather-rain-night': 'linear-gradient(135deg, rgba(8, 23, 39, 0.66), rgba(35, 62, 89, 0.5), rgba(83, 123, 148, 0.18))',
        'weather-thunderstorm-day': 'linear-gradient(135deg, rgba(30, 24, 60, 0.62), rgba(80, 73, 118, 0.42), rgba(199, 196, 221, 0.16))',
        'weather-thunderstorm-night': 'linear-gradient(135deg, rgba(11, 9, 30, 0.76), rgba(46, 35, 83, 0.55), rgba(132, 117, 179, 0.15))',
        'weather-snow-day': 'linear-gradient(135deg, rgba(210, 232, 248, 0.42), rgba(246, 251, 255, 0.34), rgba(84, 132, 166, 0.16))',
        'weather-snow-night': 'linear-gradient(135deg, rgba(43, 68, 87, 0.56), rgba(124, 158, 181, 0.36), rgba(240, 249, 255, 0.16))',
        'weather-atmosphere-day': 'linear-gradient(135deg, rgba(130, 154, 161, 0.44), rgba(211, 220, 214, 0.24), rgba(81, 108, 118, 0.18))',
        'weather-atmosphere-night': 'linear-gradient(135deg, rgba(45, 59, 66, 0.62), rgba(89, 102, 108, 0.38), rgba(164, 174, 176, 0.12))'
    }
    const key = `${weatherClass}-${isDay ? 'day' : 'night'}`
    const nextGradient = gradients[key] || gradients['weather-clouds-day']
    const currentGradient = document.body.style.getPropertyValue('--mood-bg-active') || nextGradient

    document.body.style.setProperty('--mood-bg-active', currentGradient)
    document.body.style.setProperty('--mood-bg-next', nextGradient)
    document.body.classList.add('weather-bg-fading')

    window.clearTimeout(setSmoothWeatherBackground.fadeTimer)
    setSmoothWeatherBackground.fadeTimer = window.setTimeout(() => {
        document.body.style.setProperty('--mood-bg-active', nextGradient)
        document.body.classList.remove('weather-bg-fading')
    }, 1250)
}
function updateWeatherTheme(weatherDataOrCondition) {
    document.body.classList.remove(
        'weather-clear',
        'weather-clouds',
        'weather-rain',
        'weather-thunderstorm',
        'weather-snow',
        'weather-atmosphere',
        'weather-day',
        'weather-night'
    )

    const condition = typeof weatherDataOrCondition === 'string'
        ? weatherDataOrCondition
        : weatherDataOrCondition?.weather?.[0]?.main || ''
    const id = typeof weatherDataOrCondition === 'string'
        ? undefined
        : weatherDataOrCondition?.weather?.[0]?.id
    const moodClass = getWeatherMoodClass(id, condition)
    const isDay = isWeatherDaytime(weatherDataOrCondition)

    document.body.classList.add(moodClass, isDay ? 'weather-day' : 'weather-night')
    setSmoothWeatherBackground(moodClass, isDay)
}

function updateUnitToggleLabel() {
    unitToggle.textContent = unit === 'metric' ? '°C' : '°F'
    unitToggle.title = unit === 'metric' ? 'Switch to Fahrenheit' : 'Switch to Celsius'
    unitToggle.dataset.tooltip = unit === 'metric' ? 'Celsius' : 'Fahrenheit'
    unitToggle.dataset.tooltipDetail = unit === 'metric' ? 'Click to switch temperatures to Fahrenheit.' : 'Click to switch temperatures to Celsius.'
}

function restoreScroll(scrollTop) {
    if (typeof scrollTop !== 'number') return
    requestAnimationFrame(() => {
        document.querySelector('.main-container').scrollTop = scrollTop
    })
}

function formatTempForUnit(value, unitName = unit) {
    const number = Number(value)
    const suffix = unitName === 'metric' ? 'C' : 'F'
    if (!Number.isFinite(number)) return `--°${suffix}`
    return `${Math.round(number)}°${suffix}`
}

function formatTemp(value) {
    return formatTempForUnit(value, unit)
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection]
        .forEach(item => item.style.display = 'none')
    section.style.display = 'flex'
}

function setLoadingState(isLoading) {
    searchBtn.disabled = isLoading
    cityInput.disabled = isLoading
    locationBtn.disabled = isLoading
    cityInput.placeholder = isLoading ? 'Loading weather...' : defaultSearchPlaceholder
    document.querySelector('.main-container').classList.toggle('loading-pulse', isLoading)
}

function showError(error) {
    console.error('Weather app error:', error)
    const rawMessage = String(error.message || 'Weather request failed')
    const message = rawMessage.toLowerCase()
    if (message.includes('city not found') || message.includes('not found')) {
        showFriendlyError('City not found!', 'Check the spelling or try a nearby city.')
    } else if (!navigator.onLine) {
        showFriendlyError('No internet connection', 'Reconnect and try again.')
    } else {
        showFriendlyError('Weather unavailable', rawMessage.length > 90 ? 'The weather service did not respond. Please retry.' : rawMessage)
    }
}

function showFriendlyError(title, message) {
    errorTitle.textContent = title
    errorMessage.textContent = message
    showDisplaySection(notFoundSection)
}

function titleCase(value) {
    return value
        .trim()
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

function loadObject(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '{}')
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    } catch {
        return {}
    }
}

function saveObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

function loadList(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(value) ? value : []
    } catch {
        return []
    }
}

function saveList(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
}

updateUnitToggleLabel()
setupHeaderInfoTooltips()
setupSmartTooltips()
renderSavedLists()
updateNavButtons()










function setupHeaderInfoTooltips() {
    document.querySelectorAll('.title-info:not(.info-tip)').forEach(element => {
        element.classList.remove('title-info')
        element.removeAttribute('data-tooltip')
        element.removeAttribute('data-tooltip-detail')
        if (element.dataset.autoTooltip === 'true') {
            element.removeAttribute('tabindex')
            delete element.dataset.autoTooltip
        }
    })

    const tooltipMap = [
        { selector: '.view-countries-btn', title: 'View Countries', detail: 'Show or hide popular country forecast previews.' },
        { selector: '.now-extra-card .side-title-row h3', title: 'Today Details', detail: 'Extra daily details for the latest searched city.' },
        { selector: '.comfort-card .side-title-row h3', title: 'Comfort Check', detail: 'A comfort score based on temperature, humidity, and wind.' },
        { selector: '.comfort-label-txt', title: 'Comfort Level', detail: 'Shows whether the weather feels Great, Okay, or needs Careful planning.' },
        { selector: '.comfort-track', title: 'Comfort Meter', detail: 'A visual meter showing how comfortable the current weather feels.' },
        { selector: '.quick-card .side-title-row h3', title: 'Quick Forecasts', detail: 'One-click shortcuts for common city forecasts.' },
    ]

    tooltipMap.forEach(({ selector, title, detail }) => {
        document.querySelectorAll(selector).forEach(element => {
            element.classList.add('title-info')
            element.dataset.tooltip = title
            element.dataset.tooltipDetail = detail
            if (!element.hasAttribute('tabindex') && !['BUTTON', 'A', 'INPUT'].includes(element.tagName)) {
                element.tabIndex = 0
                element.dataset.autoTooltip = 'true'
            }
        })
    })
}
function setupSmartTooltips() {
    const tooltip = document.createElement('div')
    tooltip.className = 'app-tooltip'
    tooltip.setAttribute('role', 'tooltip')
    document.body.appendChild(tooltip)

    let activeTarget = null

    function showTooltip(target) {
        const title = target.dataset.tooltip
        if (!title) return
        const detail = target.dataset.tooltipDetail || ''
        activeTarget = target
        tooltip.innerHTML = `<strong>${escapeHtml(title)}</strong>${detail ? `<span>${escapeHtml(detail)}</span>` : ''}`
        tooltip.classList.add('is-visible')
        positionTooltip(target)
    }

    function positionTooltip(target) {
        if (!target || !tooltip.classList.contains('is-visible')) return
        const rect = target.getBoundingClientRect()
        const tooltipRect = tooltip.getBoundingClientRect()
        const margin = 10
        const preferAbove = Boolean(target.closest('.top-actions'))
        let top = preferAbove ? rect.top - tooltipRect.height - margin : rect.bottom + margin

        if (top < margin) top = rect.bottom + margin
        if (top + tooltipRect.height > window.innerHeight - margin) {
            top = Math.max(margin, rect.top - tooltipRect.height - margin)
        }

        let left = rect.left + rect.width / 2 - tooltipRect.width / 2
        left = Math.min(Math.max(margin, left), window.innerWidth - tooltipRect.width - margin)

        tooltip.style.left = `${left}px`
        tooltip.style.top = `${top}px`
    }

    function hideTooltip() {
        activeTarget = null
        tooltip.classList.remove('is-visible')
    }

    document.addEventListener('pointerover', (event) => {
        const target = event.target.closest('[data-tooltip]')
        if (target) showTooltip(target)
    })

    document.addEventListener('pointerout', (event) => {
        if (activeTarget && !activeTarget.contains(event.relatedTarget)) hideTooltip()
    })

    document.addEventListener('focusin', (event) => {
        const target = event.target.closest('[data-tooltip]')
        if (target) showTooltip(target)
    })

    document.addEventListener('focusout', hideTooltip)
    window.addEventListener('resize', () => positionTooltip(activeTarget))
    document.querySelector('.main-container')?.addEventListener('scroll', () => positionTooltip(activeTarget))
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}


























