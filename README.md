# sky report

A maximalist single-screen weather display, built with Vite + React. All the
app logic is `useState` + `useEffect` in `src/App.jsx` — everything else in
that file is plain derived rendering (a theme lookup, some time formatting,
an SVG emblem). The rest of the visual richness lives in `src/styles.css`.

## Setup

```bash
npm install
cp .env.example .env
```

Open `.env` and drop in your OpenWeatherMap key:

```
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

```bash
npm run dev
```

## What it does

- Starts empty — nothing is fetched until you type a location into the field
  at the top and press enter.
- Fetches `https://api.openweathermap.org/data/2.5/weather?q={location}&appid={key}&units=metric`
  for whatever you typed (`&units=metric` was added so temperatures render in
  °C instead of raw Kelvin — drop it if you'd rather convert yourself).
- Four states, one shell: an idle prompt, a breathing pulse while loading, an
  in-voice error message with a retry button if the request fails, and the
  full scene once data lands.
- The whole palette (sun gold / cloud grey / rain blue / storm violet / haze
  sand) retints itself off a single lookup keyed to the condition OpenWeather
  returns — no extra state for that, just a plain object.
- Cloud density on screen is driven by the real `clouds.all` percentage from
  the response; day/night background is derived from `dt` vs `sunrise`/`sunset`.

## Notes

- Fonts are Fraunces (display) and Space Grotesk (data/labels), loaded from
  Google Fonts in `index.html`.
