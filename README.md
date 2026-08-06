# weather check

A responsive weather app that shows current weather, 5-day forecasts, recent searches, favorites, country previews, quick city shortcuts, theme modes, and extra daily weather details.

## Deploy on Netlify

This app uses a Netlify Function to keep the OpenWeather API key out of `script.js`.

1. Create or open the Netlify site.
2. Go to **Site configuration > Environment variables**.
3. Add this variable:
   - `OPENWEATHER_API_KEY` = your OpenWeather API key
4. Redeploy the site.

The frontend calls `/.netlify/functions/weather`, and the function calls OpenWeather securely on the server.

## Files

- `index.html` - app structure
- `style.css` - layout and visual styles
- `script.js` - app interactions and weather rendering
- `netlify/functions/weather.js` - serverless API proxy that hides the API key
- `assets/` - logos, background, weather icons, and message illustrations
