import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Pure helpers + data. Nothing here is a hook — it's just derived rendering
// logic, kept outside the component so App itself stays to state + effect.
// ---------------------------------------------------------------------------

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY



// One theme per OpenWeather "main" condition group. Everything visual reads
// from these four values, so the whole scene retints itself off one lookup.
const THEMES = {
  Clear: { accent: '#E3A857', glow: 'rgba(227,168,87,0.45)', ground: '#1F6F63', label: 'clear' },
  Clouds: { accent: '#C9CFD6', glow: 'rgba(201,207,214,0.35)', ground: '#40566A', label: 'clouded' },
  Rain: { accent: '#8FB8CE', glow: 'rgba(143,184,206,0.4)', ground: '#233B54', label: 'rain' },
  Drizzle: { accent: '#8FB8CE', glow: 'rgba(143,184,206,0.4)', ground: '#233B54', label: 'drizzle' },
  Thunderstorm: { accent: '#C77DFF', glow: 'rgba(199,125,255,0.4)', ground: '#1B1730', label: 'storm' },
  Mist: { accent: '#D8CFC0', glow: 'rgba(216,207,192,0.4)', ground: '#4A4A42', label: 'haze' },
  Haze: { accent: '#D8CFC0', glow: 'rgba(216,207,192,0.4)', ground: '#4A4A42', label: 'haze' },
  Fog: { accent: '#D8CFC0', glow: 'rgba(216,207,192,0.4)', ground: '#4A4A42', label: 'fog' },
  default: { accent: '#E3A857', glow: 'rgba(227,168,87,0.4)', ground: '#1F6F63', label: 'fair' },
}

function themeFor(main) {
  return THEMES[main] || THEMES.default
}

function localTime(unixSeconds, tzOffsetSeconds) {
  const d = new Date((unixSeconds + tzOffsetSeconds) * 1000)
  return d.toUTCString().slice(17, 22)
}

function round(n) {
  return Math.round(n)
}

function kelvinToCelsius(k) {
  return k - 273.15
}

// A single hand-drawn emblem that swaps form with the condition, rather than
// reaching for a stock icon set.
function Emblem({ main, accent }) {
  if (main === 'Clear') {
    return (
      <svg viewBox="0 0 120 120" className="emblem" aria-hidden="true">
        <circle cx="60" cy="60" r="26" fill={accent} />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180
          const x1 = 60 + Math.cos(angle) * 40
          const y1 = 60 + Math.sin(angle) * 40
          const x2 = 60 + Math.cos(angle) * 52
          const y2 = 60 + Math.sin(angle) * 52
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent} strokeWidth="3" strokeLinecap="round" />
        })}
      </svg>
    )
  }
  if (main === 'Thunderstorm') {
    return (
      <svg viewBox="0 0 120 120" className="emblem" aria-hidden="true">
        <ellipse cx="60" cy="46" rx="38" ry="22" fill={accent} opacity="0.85" />
        <polygon points="58,58 40,88 56,88 46,110 82,72 62,72 70,58" fill={accent} />
      </svg>
    )
  }
  if (main === 'Rain' || main === 'Drizzle') {
    return (
      <svg viewBox="0 0 120 120" className="emblem" aria-hidden="true">
        <ellipse cx="60" cy="44" rx="38" ry="22" fill={accent} opacity="0.9" />
        {[32, 52, 72, 92].map((x, i) => (
          <line key={i} x1={x} y1={70 + (i % 2) * 6} x2={x - 8} y2={98 + (i % 2) * 6} stroke={accent} strokeWidth="4" strokeLinecap="round" />
        ))}
      </svg>
    )
  }
  if (main === 'Mist' || main === 'Haze' || main === 'Fog') {
    return (
      <svg viewBox="0 0 120 120" className="emblem" aria-hidden="true">
        {[38, 56, 74, 92].map((y, i) => (
          <line key={i} x1={16 + (i % 2) * 10} y1={y} x2={104 - (i % 2) * 10} y2={y} stroke={accent} strokeWidth="5" strokeLinecap="round" opacity={1 - i * 0.15} />
        ))}
      </svg>
    )
  }
  // Clouds / default
  return (
    <svg viewBox="0 0 120 120" className="emblem" aria-hidden="true">
      <ellipse cx="48" cy="58" rx="30" ry="20" fill={accent} opacity="0.95" />
      <ellipse cx="76" cy="50" rx="26" ry="24" fill={accent} opacity="0.75" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// App — the only hooks in this file live here: useState to hold what came
// back, and useEffect to go get it.
// ---------------------------------------------------------------------------

export default function App() {
  const [weather, setWeather] = useState(null) 
  const [phase, setPhase] = useState('idle') // 'idle' | 'loading' | 'ready' | 'error'
  const [city, setCity] = useState('') // committed value — drives the fetch
  const [input, setInput] = useState('') // live text in the search field
  const [attempt, setAttempt] = useState(0) // bump to force a retry on the same city

  useEffect(() => {
    if (!city) return
    setPhase('loading')
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`)
      .then((res) => {
        if (!res.ok) throw new Error('bad response')
        return res.json()
      })
      .then((data) => {
        setWeather(data)
        setPhase('ready')
      })
      .catch(() => setPhase('error'))
  }, [city, attempt])

  function handleSearch(e) {
    e.preventDefault()
    if (input.trim()) setCity(input.trim())
  }

  const theme = weather ? themeFor(weather.weather?.[0]?.main) : themeFor(null)
  const cloudCover = weather?.clouds?.all ?? 40
  const isDay = weather ? weather.dt > weather.sys.sunrise && weather.dt < weather.sys.sunset : true

  return (
    <div
      className={`scene ${isDay ? 'is-day' : 'is-night'}`}
      style={{
        '--accent': theme.accent,
        '--glow': theme.glow,
        '--ground': theme.ground,
        '--cloud-opacity': Math.min(0.85, 0.15 + cloudCover / 130),
      }}
    >
      <div className="grain" aria-hidden="true" />

      <div className="cloud-layer" aria-hidden="true">
        <span className="cloud cloud--a" />
        <span className="cloud cloud--b" />
        <span className="cloud cloud--c" />
      </div>

      <header className="topline">
        <span className="place">{weather ? weather.name : 'sky report'}</span>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            className="search-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="enter a location…"
            aria-label="Location"
            autoFocus
          />
        </form>
        <span className="stamp">
          {weather ? `updated ${localTime(weather.dt, weather.timezone)}` : ''}
        </span>
      </header>

      {phase === 'idle' && (
        <main className="hero hero--idle">
          <p className="idle-text">type a city or town above, then press enter.</p>
        </main>
      )}

      {phase === 'loading' && (
        <main className="hero hero--pending">
          <div className="pulse-ring" />
          <p className="pending-text">gathering conditions over {city}…</p>
        </main>
      )}

      {phase === 'error' && (
        <main className="hero hero--error">
          <p className="error-title">the sky went quiet.</p>
          <p className="error-body">
            No reading came back for  <code>{city}</code>. Check the spelling, your API key in <code>.env</code>, and your connection, then try again.
          </p>
          <button className="retry" onClick={() => setAttempt((n) => n + 1)}>
            try again
          </button>
        </main>
      )}

      {phase === 'ready' && weather && (
        <>
          <main className="hero">
            <div className="hero-emblem">
              <Emblem main={weather.weather[0].main} accent={theme.accent} />
            </div>
            <div className="hero-reading">
              <span className="temp">
                {round(kelvinToCelsius(weather.main.temp))}
                <span className="deg">°</span>
              </span>
              <span className="condition">{weather.weather[0].description}</span>
            </div>
          </main>

          <div className="horizon" aria-hidden="true">
            <svg viewBox="0 0 1200 60" preserveAspectRatio="none" className="wave">
              <path d="M0,30 C150,60 350,0 600,30 C850,60 1050,0 1200,30 L1200,60 L0,60 Z" />
            </svg>
          </div>

          <footer className="ground">
            <dl className="stat">
              <dt>feels like</dt>
              <dd>{round(kelvinToCelsius(weather.main.feels_like))}°</dd>
            </dl>
            <dl className="stat">
              <dt>humidity</dt>
              <dd>{weather.main.humidity}%</dd>
            </dl>
            <dl className="stat">
              <dt>wind</dt>
              <dd>{weather.wind.speed} m/s</dd>
            </dl>
            <dl className="stat">
              <dt>pressure</dt>
              <dd>{weather.main.pressure}</dd>
            </dl>
            <dl className="stat">
              <dt>sunrise</dt>
              <dd>{localTime(weather.sys.sunrise, weather.timezone)}</dd>
            </dl>
            <dl className="stat">
              <dt>sunset</dt>
              <dd>{localTime(weather.sys.sunset, weather.timezone)}</dd>
            </dl>
          </footer>
        </>
      )}
    </div>
  )
}
